/**
 * @author Joel Espinosa Longi
 * @licencia Atribución-CompartirIgual 4.0 Internacional  - https://creativecommons.org/licenses/by-sa/4.0/deed.es
 */

// constants used to indicate if the book is viewed in landscape or portrait mode
const LANDSCAPE = 0;
const PORTRAIT  = 1;
/**
 * the status of the book:
 */
let book_status = {
  page : 0,  // the actual page index
  dark : false,  // the color theme
  printing : false,  // if the book is printing
  init_page_num : 0,  // the index of the first numerated page
};

// function reference to show or hide the configuration options
var show_hide_config_options;

/**
 * Externa book configuration
 */
window.book_config = window.book_config || {
  auto_numerate_sections_and_figures: false,  // use the auto numerate of sections and figures
  bibitem_ref_id: false,  // use the bibitem id, instead of the number
  open_interactives_fullscreen: false,  // show interactive in full window
};

/**
 * The book is printing
 */
window.addEventListener("beforeprint", function(event) {
  book_status.printing = true;
});

/**
 * The book finish the printing
 */
window.addEventListener("afterprint", function(event) {
  book_status.printing = false;
});

window.addEventListener("load", function(evt) {
});

window.tryfull = function(node) {
  if(document.fullscreenElement) {
    document.exitFullscreen();
  } else if(document.webkitFullscreenElement) {
    document.webkitExitFullscreen();
  } else if(document.mozFullScreenElement ) {
    document.mozExitFullscreen();
  }
  else {
    if(node.requestFullscreen) {
      node.requestFullscreen();
    } else if(node.mozRequestFullScreen) {
      node.mozRequestFullScreen();
    } else if(node.webkitRequestFullscreen) {
      node.webkitRequestFullscreen();
    } else if(node.msRequestFullscreen) {
      node.msRequestFullscreen();
    }
    else {
      return false
    }
  }
  return true;
}

/**
 * When the document is loaded, init the book construction
 */
document.addEventListener("DOMContentLoaded", function(evt) {
  document.getElementById("book_loader_container").style.display = "none";

  /**
   * prevent the iframes to show
   */
  let iframes = document.querySelectorAll("iframe");
  for (let i=0, l=iframes.length; i<l; i++) {

    if (!iframes[i].hasAttribute("data-src")) {
      iframes[i].setAttribute("data-src", iframes[i].src);
      if (iframes[i].hasAttribute("poster")) {
        iframes[i].style["background-image"] = `url("${iframes[i].getAttribute("poster")}")`;
      }
    }
    iframes[i].setAttribute("src", "about:blank");
  }
  /** */

  // get the variable values defined in the style.css file
  let body_style = getComputedStyle(document.body);
  let page_left_margin = parseInt(body_style.getPropertyValue("--page-left-margin"));
  let page_right_margin = parseInt(body_style.getPropertyValue("--page-right-margin"));
  let interactive_margin = parseInt(body_style.getPropertyValue("--interactive-margin"));
  let page_width = parseInt(body_style.getPropertyValue("--page_width"));
  let text_width = page_width - page_left_margin - page_right_margin;

  // get some elements for the book
  let pages_container = document.getElementById("pages_container");
  let pages = pages_container.querySelectorAll(".page");

  // remove the node to improve the performance
  pages_container.parentNode.removeChild(pages_container);

  // add the interactives
  addInteractive(pages_container, text_width, interactive_margin);

  // add image links
  addImageLinks(pages_container);

  // add footnotes
  addFootnotes(pages_container);

  // enumerate sections and figures
  if (book_config.auto_numerate_sections_and_figures) {
    numerateSectionsAndFigures(pages_container);
  }

  // add page references
  addPageReferences(pages_container, pages);

  // add bibliography references
  addBibliography(pages_container);

  // add table of contents
  addTableOfContentEntries(pages_container, pages);

  // add an anchor tag to images that have onclick="openInteractive(...)"
  imagesForPDF(pages_container);

  // add an anchor tag to videos and audios
  videosAudiosForPDF(pages_container);

  // add btn_config code
  addBtnConfig();

  // add the number in the page
  addPageNumbers(pages);

  init(body_style, pages_container, pages);
});

/**
 * Search the elements with the "interactive" class and include the corresponding iframe
 */
function addInteractive(pages_container, text_width, interactive_margin) {
  let interactives = pages_container.querySelectorAll(".interactive");
  let i_w;
  let i_h;
  let scale;
  let window_size;
  let new_iframe;
  let btn;
  let pdf_anchor;
  let image_poster;

  interactives.forEach((inte) => {
    let w = parseInt(inte.getAttribute("width") || 0);
    let h = parseInt(inte.getAttribute("height") || 0);
    let src = inte.getAttribute("src") || "";

    scale = parseInt( inte.getAttribute("scale") || 100 ) / 100;
    window_size = inte.getAttribute("window-size") || false;

    i_w = Math.ceil((text_width-interactive_margin*2)*scale);
    i_h = Math.ceil(i_w*(h/w));

    inte.style.width  = `${i_w + interactive_margin*2}px`;
    inte.style.height = `${i_h + interactive_margin*2}px`;

    if (! (((window.hasOwnProperty) && (window.hasOwnProperty("ontouchstart"))) || ("ontouchstart" in window))) {
      inte.style.overflow = "hidden";
    }

    new_iframe = document.createElement("iframe");
    new_iframe.style.width  = "100%";
    new_iframe.style.height = "100%";
    new_iframe.setAttribute("data-src", src);
    new_iframe.setAttribute("src", "about:blank");

    btn = document.createElement("button");
    if (window_size) {
      w = window.innerWidth;
      h = window.innerHeight;
    }

    btn.className = "btn_expand";
    btn.addEventListener("click", function(evt) {
      if (book_config.open_interactives_fullscreen) {
        if (!tryfull(inte)) {
          openInteractive(src, w, h+40, inte);
        }
      }
      else {
        openInteractive(src, w, h+40, inte);
      }
    });

    pdf_anchor = document.createElement("a");
    pdf_anchor.setAttribute("class", "PDF_anchor");
    pdf_anchor.setAttribute("href", src);
    pdf_anchor.style["padding"] = "var(--interactive-margin)";

    // lazy image poster
    if (inte.hasAttribute("poster")) {
      image_poster = document.createElement("img");
      image_poster.setAttribute("loading", "lazy");
      image_poster.setAttribute("style", "width:100%;height:100%;")
      pdf_anchor.appendChild(image_poster);
      image_poster.setAttribute("src", inte.getAttribute("poster"));
    }
    else {
      pdf_anchor.style["background-image"] = "url('book/css/img/interactive.svg')";
    }

    inte.appendChild(btn);
    inte.appendChild(new_iframe);
    inte.appendChild(pdf_anchor);
  });
}

/**
 * Add the image link functionality
 */
function addImageLinks(pages_container) {
  let img_links = pages_container.querySelectorAll(".image_link");
  let image_width;
  let tmp_div;
  let div_img_links;
  let btn;

  img_links.forEach((img) => {
    image_width = img.getAttribute("width") || "100%";
    img.setAttribute("width", "100%");

    div_img_links = document.createElement("div");
    div_img_links.setAttribute("style", "width: 100%;");

    img.parentNode.replaceChild(div_img_links, img);

    tmp_div = document.createElement("div");
    tmp_div.setAttribute("style", `margin:0 auto 1em auto; position:relative; width:${image_width};`);
    div_img_links.appendChild(tmp_div);

    tmp_div.appendChild(img);

    btn = document.createElement("button");
    btn.className = "btn_link";
    btn.setAttribute("style", "pointer-events:none;")
    tmp_div.appendChild(btn);
  });
}

/**
 * Add footnote elements
 */
function addFootnotes(pages_container) {
  let footnote_list = pages_container.querySelectorAll(".footnote");
  let footnote_parent_page;
  let footnote_container;
  let footnote_number;

  footnote_list.forEach((footnote, index) => {
    footnote_parent_page = getPageContainer(footnote);

    footnote_number = document.createElement("sup");
    footnote_number.className = "footnote_ref";
    footnote_number.textContent = index+1;
    footnote.parentNode.replaceChild(footnote_number, footnote);
    footnote.setAttribute("number", footnote_number.textContent);

    footnote_container = footnote_parent_page.querySelector(".footnote_container");
    if (!footnote_container) {
      footnote_container = footnote_parent_page.appendChild( document.createElement("div") );
      footnote_container.className = "footnote_container";
    }
    footnote_container.appendChild(footnote);
  });
}

/**
 * Add the numbers to sections and figures
 */
function numerateSectionsAndFigures(pages_container) {
  let chapter_counter = 0;
  let section_counter = 0;
  let subsection_counter = 0;
  let subsubsection_counter = 0;
  let figcaption_prefix;
  let figcaption_counter;
  let figcaption_prefix_counter = {};
  let num_block_counter;
  let num_block_prefix_counter = {};
  let tag_name;

  let elements = pages_container.querySelectorAll(".chap_name,h2,h3,h4,figcaption,.num_block");

  elements.forEach((ele) => {
    if (ele.classList.contains("chap_name")) {
      chapter_counter++;
      section_counter = 0;
      num_block_prefix_counter = {};
      figcaption_prefix_counter = {};
      ele.level = 0;

      if (!ele.hasAttribute("prefix")) {
        ele.setAttribute("prefix", chapter_counter);
      }
      ele.level = 0;
    }
    else if (chapter_counter > 0) {
      tag_name = ele.tagName.toLocaleLowerCase();

      if (!ele.hasAttribute("not_number")) {
        // section
        if (tag_name == "h2") {
          section_counter++;
          subsection_counter = 0;
          ele.level = 1;
          ele.innerHTML = `${chapter_counter}.${section_counter} ${ele.innerHTML}`;
        }
        // subsection
        else if (tag_name == "h3") {
          subsubsection_counter = 0;
          ele.level = 2;
          if (section_counter > 0) {
            subsection_counter++;
            ele.innerHTML = `${chapter_counter}.${section_counter}.${subsection_counter} ${ele.innerHTML}`;
          }
          else {
            ele.innerHTML = `${ele.innerHTML}`;
          }
        }
        // subsubsection
        else if (tag_name == "h4") {
          ele.level = 3;
          if ((section_counter > 0) && (subsection_counter > 0)) {
            subsubsection_counter++;
            ele.innerHTML = `${chapter_counter}.${section_counter}.${subsection_counter}.${subsubsection_counter} ${ele.innerHTML}`;
          }
          else {
            ele.innerHTML = `${ele.innerHTML}`;
          }
        }
        // figure
        else if (tag_name == "figcaption") {
          if (!(ele.hasAttribute("prefix") && (ele.getAttribute("prefix") == ""))) {
            figcaption_prefix = ele.getAttribute("prefix") || "Figura";
            figcaption_counter = figcaption_prefix_counter[figcaption_prefix] || 0;
            figcaption_counter++;
            figcaption_prefix_counter[figcaption_prefix] = figcaption_counter;
            ele.ref_text = `<span class="figcaption_prefix">${figcaption_prefix} ${chapter_counter}.${figcaption_counter}</span>`;
            ele.parentNode.ref_text = ele.ref_text;
            ele.innerHTML = `${ele.ref_text}. ${ele.innerHTML}`;
          }
        }
        // num_block
        else if ((tag_name == "div") && (ele.classList.contains("num_block"))) {
          num_block_counter = num_block_prefix_counter[ele.getAttribute("prefix")] || 0;
          num_block_counter++;
          num_block_prefix_counter[ele.getAttribute("prefix")] = num_block_counter;
          ele.ref_text = `<span class="num_block_prefix">${ele.getAttribute("prefix") || ""} ${chapter_counter}.${num_block_counter}</span>`;
          ele.innerHTML = `${ele.ref_text}. ${ele.innerHTML}`;
        }
      }
      else {
        // section
        if (tag_name == "h2") {
          ele.level = 1;
          ele.innerHTML = `${ele.innerHTML}`;
        }
        // subsection
        else if (tag_name == "h3") {
          ele.level = 2;
          ele.innerHTML = `${ele.innerHTML}`;
        }
        // subsubsection
        else if (tag_name == "h4") {
          ele.level = 3;
          ele.innerHTML = `${ele.innerHTML}`;
        }
      }
    }
    // if the book do not use the chap_name class
    else {
      tag_name = ele.tagName.toLocaleLowerCase();

      // figure
      if (tag_name == "figcaption") {
        figcaption_prefix = ele.getAttribute("prefix") || "Figura";
        figcaption_counter = figcaption_prefix_counter[figcaption_prefix] || 0;
        figcaption_counter++;
        figcaption_prefix_counter[figcaption_prefix] = figcaption_counter;
        ele.ref_text = `<span class="figcaption_prefix">${figcaption_prefix} ${figcaption_counter}</span>`;
        ele.parentNode.ref_text = ele.ref_text;
        ele.innerHTML = `${ele.ref_text}. ${ele.innerHTML}`;
      }
    }
  });

  // add the figures references
  let refs = pages_container.querySelectorAll("ref");
  let ref_elem;
  refs.forEach((ref) => {
    ref_elem = pages_container.querySelector(escapeIdForQuerySelector(ref.getAttribute("ref_id") || ""));
    if (ref_elem) {
      ref.innerHTML = ref_elem.ref_text;
    }
  });
}

/**
 * Add references to pages
 */
function addPageReferences(pages_container, pages_dom) {
  let prefs = pages_container.querySelectorAll("pageref");
  let init_page_num;
  let pages;
  let refpage;
  let page_num;
  let prefix;
  let postfix;
  let digits;
  let page_num_str;

  if (prefs.length > 0) {
    pages = Array.from(pages_dom);

    init_page_num = pages_container.querySelector("[init-page-num=true]");
    if (init_page_num) {
      init_page_num = pages.indexOf(init_page_num)-1;
    }
    else {
      init_page_num = 0;
    }
  }

  prefs.forEach((ref) => {
    refpage = pages_container.querySelector(escapeIdForQuerySelector(ref.getAttribute("ref_id")));
    
    if (refpage) {
      refpage = getPageContainer(refpage);
      page_num = pages.indexOf(refpage);

      if (page_num != -1) {
        page_num -= init_page_num;
        page_num_str = page_num;
        ref.setAttribute("onclick", `goToPage(${page_num})`);

        prefix = ref.getAttribute("prefix");
        prefix = (prefix) ? prefix + " " : "";

        postfix = ref.getAttribute("postfix");
        postfix = (postfix) ? " " + postfix : "";

        digits = ref.getAttribute("digits");
        if (digits) {
          digits = parseInt(digits);
          // the number of digits is a number, then complete with zeros at the start
          if (!isNaN(digits)) {
            page_num_str = (page_num.toString()).padStart(digits, "0");
          }
        }

        if (!ref.innerHTML.trim()) {
          ref.innerHTML = `<span class="pageref_prefix">${prefix}</span><span class="pageref_number">${page_num_str}</span><span class="pageref_postfix">${postfix}</span>`;
        }
      }
    }    
  });
}

/**
 * Add the bibliography elements
 */
function addBibliography(pages_container) {
  let bibitems = pages_container.querySelectorAll("bibitem");
  let tmp;
  let tmp_attr;
  let ref;
  let label;
  let attr_list = ["authors", "title", "editorial", "edition", "year"];

  bibitems.forEach((item, index) => {
    // id
    tmp_attr = item.getAttribute("id");
    ref = (window.book_config.bibitem_ref_id) ? tmp_attr : index+1;

    label = item.getAttribute("label");
    item.setAttribute("REFID", (label) ? label : ref);

    tmp = document.createElement("span")
    tmp.innerHTML = `[${(label) ? label : ref}]`;
    tmp.classList = "bibitem_id";

    if (item.textContent.trim() != "") {
      item.insertBefore(tmp, item.firstChild);
    }
    else {
      item.appendChild(tmp);

      for (let i=0; i<attr_list.length; i++) {
        tmp_attr = item.getAttribute(attr_list[i]);
        if (tmp_attr) {
          tmp = document.createElement("span")
          tmp.innerHTML = tmp_attr + ". ";
          tmp.classList = "bibitem_" + attr_list[i];
          item.appendChild(tmp);
        }
      }
    }
  });

  // add bib references
  let bibrefs = pages_container.querySelectorAll("bibref");
  let tmp_id;
  let popup_bib_info;

  bibrefs.forEach(ref => {
    tmp_id = pages_container.querySelector(escapeIdForQuerySelector(ref.getAttribute("ref_id") || ""));

    if (tmp_id) {
      if (ref.innerHTML.trim() == "") {
        ref.innerHTML = "[" + tmp_id.getAttribute("REFID") + "]";
      }

      // needs to be let to store the text for the click event
      let txt = tmp_id.innerHTML;

      ref.addEventListener("click", function(evt) {
        popup_bib_info = document.querySelector(".popup_bib_info");
        popup_bib_info.style.display = "block";
        popup_bib_info.firstChild.innerHTML = txt;
      });
    }
  });
}

/**
 * Add the table of content entries
*/
function addTableOfContentEntries(pages_container, pages_dom) {
  let init_page_num = pages_container.querySelector("[init-page-num=true]");
  let toc_links = pages_container.querySelectorAll(".toc_link");
  let auto_toc_links = [];
  let no_auto_toc_links = [];

  toc_links.forEach((toc_link) => {
    if (toc_link.getAttribute("href")) {
      auto_toc_links.push(toc_link);
    }
    else {
      no_auto_toc_links.push(toc_link);
    }
  });

  let temp_a;
  // adjust style of manual toc links
  if (no_auto_toc_links.length > 0) {
    no_auto_toc_links.forEach(toc_link => {
      temp_a = toc_link.querySelector("a");

      if ((temp_a) && (!temp_a.innerHTML.match(/^<span/))) {
        temp_a.innerHTML = "<span>" + temp_a.innerHTML.replace(/<span class="toc_number">/, `</span><span class="toc_number">`)
      }
    });
  }

  if (auto_toc_links.length > 0) {
    let pages = Array.from(pages_dom);

    if (init_page_num) {
      init_page_num = pages.indexOf(init_page_num)-1;
    }
    else {
      init_page_num = 0;
    }

    let elem;
    let elem_text;
    let elem_level;
    let page_elem;
    let page_num;
    let prefix;
    let pdf_anchor;

    for (let i=0, l=auto_toc_links.length; i<l; i++) {
      elem = pages_container.querySelector( auto_toc_links[i].getAttribute("href") );

      if (!elem) {
        continue;
      }

      elem_text = elem.textContent.trim().replace(/\.$/, "");

      page_elem = getPageContainer(elem);
      elem_level = parseInt( elem.level || 0 );

      if (page_elem) {
        page_num = pages.indexOf(page_elem);

        if (page_num != -1) {
          page_num -= init_page_num;
          auto_toc_links[i].setAttribute("onclick", `goToPage(${page_num})`);

          // mantain the content of toc_link element
          if (auto_toc_links[i].innerHTML.trim() == "") {
            prefix = elem.getAttribute("prefix") || auto_toc_links[i].getAttribute("prefix");

            auto_toc_links[i].setAttribute("level", elem_level);
            auto_toc_links[i].innerHTML = `<a><span>${(prefix)?prefix+".":""} ${elem_text}</span><span class="toc_number">${page_num}</span></a>`;
          }

          pdf_anchor = document.createElement("a");
          pdf_anchor.setAttribute("class", "PDF_anchor");
          pdf_anchor.setAttribute("href", auto_toc_links[i].getAttribute("href"));
          auto_toc_links[i].appendChild(pdf_anchor);
        }
      }
    }
  }

  // add elements to the table of content
  let toc = document.getElementById("table_of_content");
  if (toc) {
    toc.innerHTML = "";

    let close_toc = toc.appendChild(document.createElement("button"));
    close_toc.setAttribute("id", "close_to_table_of_content");

    let link_clone;
    let tmp;
    for (entry of toc_links) {
      link_clone = entry.cloneNode(true);

      tmp = getChildOnClickStr(link_clone);

      if (tmp) {
        link_clone.setAttribute("onclick", tmp.replace(/\)/g, ",true)"));

        tmp = tmp.match(/(\d)+/g)[0];
        link_clone.setAttribute("page_num", tmp);
      }

      toc.appendChild(link_clone);
    }
    toc.addEventListener("click", (evt) => {
      toc.style.display = "none";
    });
  }
}

/**
 * Add images to show when the book is printing
 */
function imagesForPDF(pages_container) {
  let images = pages_container.querySelectorAll("img[onclick]");
  let onclick;
  let parent;
  let pdf_anchor;
  let newURL;

  images.forEach((img) => {
    onclick = img.getAttribute("onclick");
    parent = img.parentNode;

    pdf_anchor = document.createElement("a");
    pdf_anchor.setAttribute("style", "width: 100%;height: 100%;");
    img.addEventListener("click", function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
    });

    parent.replaceChild(pdf_anchor, img);
    pdf_anchor.appendChild(img);

    // openInteractive
    newURL = onclick.match(/openInteractive..(.+?).,/);
    if ( (newURL) && (newURL[1])) {
      pdf_anchor.setAttribute("href", newURL[1]);
    }
    else {
      // openImage
      newURL = onclick.match(/openImage\(this\)/);
      if (newURL) {
        pdf_anchor.setAttribute("href", img.getAttribute("src"));
      }
    }
  });
}

/**
 * Add anchor tags when the book is printing
 */
function videosAudiosForPDF(pages_container) {
  let media = pages_container.querySelectorAll("video,audio");
  let parent;
  let pdf_anchor;
  let newURL;

  media.forEach((ele) => {
    parent = ele.parentNode;

    pdf_anchor = document.createElement("a");
    pdf_anchor.setAttribute("style", "width: 100%;height: 100%;");

    newURL = ele.getAttribute("src");
    if (!newURL) {
      newURL = ele.querySelector("source");
      if (newURL) {
        newURL = newURL.getAttribute("src");
      }
    }
    pdf_anchor.setAttribute("href", newURL || "");

    // prevent the anchor to work
    ele.addEventListener("click", function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
    });

    parent.replaceChild(pdf_anchor, ele);
    pdf_anchor.appendChild(ele);
  });
}

/**
 * Get the page element that is the parent of an element
 */
function getPageContainer(elem) {
  while (elem && !elem.classList.contains("page")) {
    elem = elem.parentNode;
  }
  return elem;
}

/**
 * Find the onclick string for page number of custom toc_links
 */
function getChildOnClickStr(elem) {
  let onclick = elem.getAttribute("onclick");

  if (onclick) {
    return onclick;
  }

  for (let i=0; i<elem.children.length; i++) {
    onclick = elem.children[i].getAttribute("onclick");
    if (onclick) {
      return onclick;
    }
  }

  return null;
}

/** 
 * Set the information to the URL
 */
function setURLParams() {
  let loc = window.location.pathname;
  let params = "";
  
  if (book_status.page >= 1) {
    params = `?page=${book_status.page}`;
  }

  let ini = (params == "") ? "?" : "&";

  if (book_status.dark) {
    params += ini + "theme=dark";
  }

  if (!book_status.printing) {
    history.replaceState({}, "doc", loc + params);
  }
}

/**
 * 
 */
function escapeIdForQuerySelector(id) {
  return `[id='${id}']`;
}

/**
 * 
 */
function addBtnConfig() {
  let btn_config = document.getElementById("btn_config");
  let config_options = document.getElementById("config_options");
  let show_config = false;

  show_hide_config_options = function() {
    show_config = !show_config;
    config_options.style.display = (show_config) ? "block" : "none";
  }

  if (btn_config) {
    btn_config.addEventListener("click", (evt) => {
      show_hide_config_options();
    });

    // close tools when button pressed
    config_options.addEventListener("click", (evt) => {
      if (evt.target.tagName.toLowerCase() == "button") {
        show_hide_config_options();
      }
    });

    let dark_light_mode = document.getElementById("dark_light_mode");

    if (dark_light_mode) {
      // get the theme from the URL
      let tmp_theme = new URLSearchParams(window.location.search).get("theme");

      let div = dark_light_mode.appendChild(document.createElement("div"));

      let light = div.appendChild(document.createElement("button"));
      let sw = div.appendChild(document.createElement("input"));
      let dark = div.appendChild(document.createElement("button"));

      // init the theme
      if (tmp_theme == "dark") {
        sw.checked = true;
        document.body.classList.add("dark");
      } else {
        sw.checked = false;
        document.body.classList.remove("dark");
      }
      book_status.dark = sw.checked;

      // light button action
      light.setAttribute("id", "btn_light");
      light.addEventListener("click", (evt) => {
        document.body.classList.remove("dark");
        sw.checked = false;

        book_status.dark = sw.checked;
        setURLParams();
      });
      
      // switch action
      sw.setAttribute("class", "switch");
      sw.setAttribute("type", "checkbox");
      sw.addEventListener("change", (evt) => {
        document.body.classList.toggle("dark");

        book_status.dark = sw.checked;
        setURLParams();
        
        show_hide_config_options();
      });

      // dark button action
      dark.setAttribute("id", "btn_dark");
      dark.addEventListener("click", (evt) => {
        document.body.classList.add("dark");
        sw.checked = true;

        book_status.dark = "dark";
        setURLParams();
      });
    }
  }
}

/**
 * Add the number of pages
 */
function addPageNumbers(pages) {
  book_status.init_page_num = 0;
  let arabic_number_page = 0;
  let tmp_num;
  let tmp_num_str;

  for (let i=0; i<pages.length; i++) {
    if (pages[i].hasAttribute("init-page-num")) {
      book_status.init_page_num = i;
    }
    if (pages[i].hasAttribute("num-type-arabic")) {
      arabic_number_page = i;
    }
  }
  for (let i=0; i<pages.length; i++) {
    if (i >= book_status.init_page_num) {
      tmp_num_str = (i < arabic_number_page) ? toRoman((i - book_status.init_page_num) +1) : (i - book_status.init_page_num) +1;
      pages[i].setAttribute("page_num", tmp_num_str);

      if (!pages[i].hasAttribute("num")) {
        tmp_num = pages[i].appendChild( document.createElement("div") );
        tmp_num.innerHTML = `<span>${tmp_num_str}</span>`;
        tmp_num.className = "page_number";
      }
    }
  }
}

/**
 * Init the book navigation
 */
function init(body_style, pages_container, pages) {
  let current_page = 0;

  let book_container = document.getElementById("book_container");

  let page_viewer = book_container.appendChild( document.createElement("div") );
  page_viewer.className = "page_viewer";
  page_viewer.appendChild(pages_container);

  // prevent change in the scrollLeft attribute
  page_viewer.addEventListener("scroll", (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    page_viewer.scrollLeft = 0;
    setTimeout(function() {
      page_viewer.scrollLeft = 0;
    }, 100);
  });


  let pages_container_width = parseInt(body_style.getPropertyValue("--pages_container_width"));
  let pages_container_height = parseInt(body_style.getPropertyValue("--pages_container_height"));

  let back = document.getElementById("btn_back_page");
  let next = document.getElementById("btn_next_page");

  let toc_btn = document.getElementById("go_to_table_of_content");

  let orientation = LANDSCAPE;

  let popup_bib_info = book_container.appendChild(document.createElement("div"));
  popup_bib_info.className = "popup_bib_info";
  popup_bib_info.appendChild(document.createElement("span"));
  let popup_bib_info_close = popup_bib_info.appendChild(document.createElement("button"));
  popup_bib_info_close.textContent = "×";
  popup_bib_info_close.addEventListener("click", () => {
    popup_bib_info.style.display = "none";
  });

  
  // get the current page from the URL
  let tmp_current_page = new URLSearchParams(window.location.search).get("page");
  if (tmp_current_page != null) {
    current_page = parseInt( tmp_current_page) + book_status.init_page_num-1;
  }
  //

  /** Hide the child nodes of each page to help the rendering in chrome */
  for (let i=0; i<pages.length; i++) {
    pages[i].setAttribute("show", "true");
  }

  /** add the back and next actions to the buttons */
  let inc;
  back.addEventListener("click", function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    inc = (orientation === LANDSCAPE) ? 2 : 1;
    goToPage(Math.max(current_page-inc, 0));
  });
  next.addEventListener("click", function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    inc = (orientation === LANDSCAPE) ? 2 : 1;
    goToPage(Math.min(current_page+inc, pages.length-1));
  });

  /**
   *
  */
  function goToPage(new_page) {
    new_page = Math.max(0, Math.min(pages.length-1, new_page));

    // set the value of the page in the book status
    book_status.page = new_page - book_status.init_page_num + 1;
    setURLParams();


    if ( (orientation === PORTRAIT) && (new_page === 0) ) {
      new_page = 1;
    }
    if ( (orientation === LANDSCAPE) && (new_page % 2) ) {
      new_page--;
    }

    // get the iframes in the current pages
    let last_iframes = [];
    for (let i=current_page-2; i<current_page+4; i++) {
      if ((i >= 0) && (i < pages.length)) {
        // hide the elements of the current pages
        pages[i].setAttribute("show", "true");

        if (!pages[i].iframes) {
          pages[i].iframes = Array.from(pages[i].querySelectorAll("iframe"));
        }
        last_iframes = last_iframes.concat(pages[i].iframes);
      }
    }
    // get the videos in the current pages
    let last_videos = [];
    for (let i=current_page; i<current_page+2; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].videos) {
          pages[i].videos = Array.from(pages[i].querySelectorAll("video"));
        }
        last_videos = last_videos.concat(pages[i].videos);
      }
    }
    // get the audios in the current pages
    let last_audios = [];
    for (let i=current_page; i<current_page+2; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].audios) {
          pages[i].audios = Array.from(pages[i].querySelectorAll("audio"));
        }
        last_audios = last_audios.concat(pages[i].audios);
      }
    }


    // change the current page
    current_page = new_page;

    // get the iframes in the next page (the new current page)
    let next_iframes = [];
    for (let i=current_page-2; i<current_page+4; i++) {
      if ((i >= 0) && (i < pages.length)) {
        // show the elements in the current pages
        pages[i].removeAttribute("show");

        if (!pages[i].iframes) {
          pages[i].iframes = Array.from(pages[i].querySelectorAll("iframe"));
        }
        next_iframes = next_iframes.concat(pages[i].iframes);
      }
    }
    // get the videos in the next page (the new current page)
    let next_videos = [];
    for (let i=current_page; i<current_page+2; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].videos) {
          pages[i].videos = Array.from(pages[i].querySelectorAll("video"));
        }
        next_videos = next_videos.concat(pages[i].videos);
      }
    }
    // get the audios in the next page (the new current page)
    let next_audios = [];
    for (let i=current_page; i<current_page+2; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].audios) {
          pages[i].audios = Array.from(pages[i].querySelectorAll("audio"));
        }
        next_audios = next_audios.concat(pages[i].audios);
      }
    }


    // get all the iframes to deactivate
    let deactivate_iframes = last_iframes.filter((el) => {
      return !(next_iframes.includes(el));
    });
    for (let i=0, l=deactivate_iframes.length; i<l; i++) {
      deactivate_iframes[i].setAttribute("src", "about:blank");
    }
    for (let i=0, l=next_iframes.length; i<l; i++) {
      if (next_iframes[i].getAttribute("src") == "about:blank") {
        next_iframes[i].setAttribute("src", next_iframes[i].getAttribute("data-src"));
      }
    }

    // get all the videos to stop
    let stop_videos = last_videos.filter((el) => {
      return !(next_videos.includes(el));
    });
    for (let i=0, l=stop_videos.length; i<l; i++) {
      stop_videos[i].pause();
      stop_videos[i].currentTime = 0;
    }

    // get all the audios to stop
    let stop_audios = last_audios.filter((el) => {
      return !(next_audios.includes(el));
    });
    for (let i=0, l=stop_audios.length; i<l; i++) {
      stop_audios[i].pause();
      stop_audios[i].currentTime = 0;
    }
    
    // move the pages
    pages_container.style.left = -(pages_container_width/2 * current_page) + "px";
  }

  
  /** */
  window.goToPage = function(num) {
    goToPage( (orientation === LANDSCAPE) ? parseInt(parseInt((num+2) / 2) * 2) : num+2 );
  }

  /** */
  window.openImage = function(img, w, h) {
    let src;

    if (typeof(img) == "string") {
      src = img;
      w = w || screen.availWidth;
      h = h || screen.availHeight;
    }
    else if (typeof(img) == "object") {
      src = img.src || "about:blank";
      w = w || img.naturalWidth || screen.availWidth;
      h = h || img.naturalHeight || screen.availHeight;
    }
    
    if ((book_config.open_interactives_fullscreen) && (typeof(img) == "object")) {
      if (!tryfull(img)) {
        window.open(src, "_blank", `scrollbars=yes,resizable=yes,location=0,titlebar=0,menubar=0,status=0,toolbar=0,left=${(screen.availWidth-w)/2},top=${(screen.availHeight-h)/2},width=${w},height=${h}`);
      }
    }
    else {
      window.open(src, "_blank", `scrollbars=yes,resizable=yes,location=0,titlebar=0,menubar=0,status=0,toolbar=0,left=${(screen.availWidth-w)/2},top=${(screen.availHeight-h)/2},width=${w},height=${h}`);
    }
  }

  /** */
  window.openInteractive = function(href, width, height, node) {
    window.open(href, "_blank", `scrollbars=yes,resizable=yes,location=0,titlebar=0,menubar=0,status=0,toolbar=0,left=${(screen.availWidth-width)/2},top=${(screen.availHeight-height)/2},width=${width},height=${height}`);
  }

  // if the page has table of content container then the button go_to_table_of_content shows the container
  let last_toc_link = null;
  let toc = document.getElementById("table_of_content");
  
  if (toc) {
    let toc_links = toc.querySelectorAll(".toc_link");

    toc_btn.addEventListener("click", function(evt) {
      let pn = parseInt(pages[current_page].getAttribute("page_num"));
      let toc_selected = document.querySelector(".toc_selected");

      if (toc_selected) {
        toc_selected.classList.remove("toc_selected");
      }

      if (pn) {
        for (let i=0; i<toc_links.length; i++) {
          if (pn >= parseInt(toc_links[i].getAttribute("page_num"))) {
            last_toc_link = toc_links[i];
          }
          else {
            break;
          }
        }
        if (last_toc_link) {
          last_toc_link.classList.add("toc_selected");
        }
      }

      toc.style.display = "block";
    });
  }
  // if not table of content container then go to the first page with a toc_link class
  else {
    // find the first toc_link
    let toc_links = document.querySelectorAll(".toc_link");
    let toc_index_page = 0;

    if (toc_links.length > 0) {
      let parent = getPageContainer(toc_links[0]);

      for (let i=0; i<pages.length; i++) {
        if (pages[i] == parent) {
          toc_index_page = i - book_status.init_page_num + 1;
          break;
        }
      }
    }

    toc_btn.addEventListener("click", function(evt) {
      window.goToPage(toc_index_page);
    });
  }


  /** */
  let x = null;
  let swipe_length = 50;
  let click_time = 100000;
  function unify(evt) {
    return (evt.changedTouches) ? evt.changedTouches[0] : evt
  };

  function getCoord(evt) {
    evt.stopPropagation();
    x = unify(evt).clientX;
    click_time = Date.now();
  }
  function move(evt) {
    if (Date.now() - click_time < 220) {
      if (x !== null) {
        let dx = unify(evt).clientX - x;
        let s = Math.sign(dx);

        if ( ((current_page > 0) && (s > 0)) || ((current_page < pages.length-1) && (s < 0)) ) {
          if (Math.abs(dx) > swipe_length) {
            inc = (orientation === LANDSCAPE) ? 2 : 1;
            evt.preventDefault();
            goToPage( current_page - s*inc );
          }
        }
      }
    }
  }

  book_container.addEventListener("mousedown",  getCoord, false);
  book_container.addEventListener("touchstart", getCoord, false);
  book_container.addEventListener("mouseup",  move, false);
  book_container.addEventListener("touchend", move, false);

  /** */
  window.focus();
  window.addEventListener("keydown", function(evt) {
    if (evt.key === "ArrowLeft") {
      back.click();
    }
    if (evt.key === "ArrowRight") {
      next.click();
    }
    if (evt.key === "Home") {
      goToPage(0);
    }
    if (evt.key === "End") {
      goToPage(pages.length-1);
    }
  });


  /**
   *
   */
  window.addEventListener("resize", resize);
  function resize(evt) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let tmp_w;

    if (w > h) {
      tmp_w = pages_container_width;
      orientation = LANDSCAPE;
    }
    else {
      tmp_w = pages_container_width/2;
      orientation = PORTRAIT;
    }

    page_viewer.style.width = `${tmp_w}px`;

    let scaleToFitX = w/tmp_w;
    let scaleToFitY = h/pages_container_height;

    if (scaleToFitX < scaleToFitY) {
      page_viewer.style.left = "0px";
      page_viewer.style.top = "50%";
      page_viewer.style.transform = `scale(${scaleToFitX}) translate(0, -50%)`;
    }
    else {
      page_viewer.style.left = "50%";
      page_viewer.style.top = "0px";
      page_viewer.style.transform = `scale(${scaleToFitY}) translate(-50%, 0)`;
    }

    goToPage(current_page);
  }
  resize();
}

const ROMAN_U = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
const ROMAN_D = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];

function toRoman(num) {
  let roman_number = "";

  if (num < 100) {
    roman_number = ROMAN_D[parseInt(num/10)];
    num = num - (parseInt(num/10))*10;
  }

  if (num < 10) {
    roman_number += ROMAN_U[num];
  }

  return roman_number.toLowerCase();
}
