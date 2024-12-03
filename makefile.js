const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const outputFilePath = './book-min.js';

const book_js_content = fs.readFileSync('js/book.js', 'utf8').replace(/url\('book\/icons\.svg/g, 'url("${icons_url}');
const icons_svg_content = fs.readFileSync('css/icons.svg', 'utf8').replace(/\s+/g, " ");
const loader_css_content = (new CleanCSS().minify(fs.readFileSync('css/loader.css', 'utf8').replace(/url\("\.\/icons\.svg/g, 'url("${icons_url}'))).styles;
const style_css_content = (new CleanCSS().minify(fs.readFileSync('css/style.css', 'utf8').replace('@import "loader.css";', "").replace(/url\("\.\/icons\.svg/g, 'url("${icons_url}'))).styles;

let book_min_content = 
`let loader_style = document.createElement("style");
loader_style.innerHTML = \`${loader_css_content}\`;
document.head.appendChild(loader_style);` + 
book_js_content + `
function addStyle() {
	let svg = \`${icons_svg_content}\`;
  
	icons_url = URL.createObjectURL(new Blob([svg], { type:"image/svg+xml" }));

	let styleNode = document.createElement("style");
	styleNode.innerHTML = \`${style_css_content}\`;

	document.head.insertBefore(styleNode, document.head.firstChild);
	addStyle = new Function();
}`;

minify(book_min_content).then(result => {
  // console.log(result);
  fs.writeFileSync(outputFilePath, result.code, 'utf8');
  console.log("listo, todo OK");
}).catch(err => {
  console.error('Error durante la minificación:', err);
});
