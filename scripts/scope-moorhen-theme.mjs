import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postcss from "postcss";
import prefixSelector from "postcss-prefix-selector";

const SCOPE = ".moorhen-scope";
const ROOT_LIKE = new Set([":root", "html", "body"]);

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = ["flatly.css", "darkly.css"].map((name) =>
    path.join(dir, "..", "public", "baby-gru", name)
);

const plugin = prefixSelector({
    prefix: SCOPE,
    transform(prefix, selector, prefixedSelector) {
        if (ROOT_LIKE.has(selector.trim())) return prefix;
        return prefixedSelector;
    },
});

for (const file of files) {
    const css = readFileSync(file, "utf8");
    const result = postcss([plugin]).process(css, { from: file }).css;
    writeFileSync(file, result);
    console.log(`Scoped ${path.basename(file)} under ${SCOPE}`);
}
