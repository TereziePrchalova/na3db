import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";

const SCOPE = ".moorhen-scope";
const ROOT_LIKE = new Set([":root", "html", "body"]);
const PREAMBLE_AT_RULES = new Set(["charset", "import"]);

// Bootstrap's own floating/portal UI (react-bootstrap renders dropdowns,
// modals, tooltips, etc. via createPortal into document.body, physically
// outside .moorhen-scope) - left globally scoped since our own app never
// uses these Bootstrap-specific class names, so there's no collision risk.
const PORTAL_RE = /\.(dropdown-menu|dropdown-item|dropdown-header|dropdown-divider|modal|popover|tooltip|offcanvas|toast|bs-tooltip|bs-popover)\b/;

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = ["flatly.css", "darkly.css"].map((name) =>
    path.join(dir, "..", "public", "baby-gru", name)
);

function isRootLike(node) {
    return node.type === "rule" && node.selectors.every((s) => ROOT_LIKE.has(s.trim()));
}

// Moves everything in `node` that isn't portal-related into `target`,
// mutating `node` in place to remove what got moved. For a plain rule,
// that's usually the whole rule; for a container at-rule (@media,
// @keyframes, ...) it recurses so only the non-portal children move,
// leaving a same-params clone of the container behind in `target` and the
// portal children behind in `node`. Without this, a single portal selector
// anywhere inside e.g. an `@media` breakpoint block would keep the *entire*
// block - hundreds of unrelated grid/utility rules - globally unscoped
// alongside it.
function moveNonPortal(node, target) {
    if (node.type === "rule") {
        // A rule's selector list is comma-separated (e.g. `.dropdown-menu,
        // .input-group > .form-control`) - test and split each one
        // individually rather than the whole list, so one portal selector
        // in the list doesn't drag unrelated selectors along with it.
        const portalSelectors = node.selectors.filter((s) => PORTAL_RE.test(s));
        if (portalSelectors.length === node.selectors.length) return; // all portal, stays as-is
        const moved = node.clone();
        moved.selector = node.selectors.filter((s) => !PORTAL_RE.test(s)).join(", ");
        if (portalSelectors.length === 0) {
            node.remove();
        } else {
            node.selector = portalSelectors.join(", ");
        }
        target.append(moved);
        return;
    }
    if (node.type === "atrule" && node.nodes) {
        const clone = postcss.atRule({ name: node.name, params: node.params, nodes: [] });
        for (const child of node.nodes.slice()) {
            moveNonPortal(child, clone);
        }
        if (clone.nodes.length) target.append(clone);
        if (node.nodes.length === 0) node.remove();
    }
}

// Wraps the theme in `@scope (.moorhen-scope) { ... }` instead of prefixing
// or appending :not() to every selector. Unlike those, @scope restricts
// *where* a rule applies without adding anything to its specificity - so
// Bootstrap's plain-tag selectors keep exactly the (low) specificity they'd
// have in a vanilla Bootstrap install, correctly losing to more specific
// selectors from other libraries Moorhen embeds (e.g. MUI's single-class
// `.css-xxxxx` styles) instead of being pushed above them.
const scopeTheme = () => ({
    postcssPlugin: "scope-moorhen-theme",
    OnceExit(root) {
        const scoped = postcss.atRule({ name: "scope", params: `(${SCOPE})` });
        const topNodes = root.nodes.filter(
            (node) => !(node.type === "atrule" && PREAMBLE_AT_RULES.has(node.name))
        );

        for (const node of topNodes) {
            if (isRootLike(node)) {
                // :root/html/body declarations (mostly CSS custom properties)
                // need to live on the scope root itself, not a descendant -
                // @scope's boundary can't include its own root that way, so
                // relocate them onto `.moorhen-scope` directly, left outside @scope.
                node.selector = SCOPE;
                continue;
            }
            moveNonPortal(node, scoped);
        }

        root.append(scoped);
    },
});
scopeTheme.postcss = true;

for (const file of files) {
    const css = readFileSync(file, "utf8");
    const result = postcss([scopeTheme]).process(css, { from: file }).css;
    writeFileSync(file, result);
    console.log(`Scoped ${path.basename(file)} to ${SCOPE} via @scope (portals left global)`);
}
