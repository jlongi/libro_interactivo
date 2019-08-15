/**
 * @author Joel Espinosa Longi
 * @licencia Atribución-CompartirIgual 4.0 Internacional  - https://creativecommons.org/licenses/by-sa/4.0/deed.es
 */

const LANDSCAPE = 0;
const PORTRAIT  = 1;

document.addEventListener("DOMContentLoaded", function(evt) {
  /** prevent the iframes to show */
  let iframes = document.querySelectorAll("iframe");
  for (let i=0, l=iframes.length; i<l; i++) {
    if (!iframes[i].hasAttribute("data-src")) {
      iframes[i].setAttribute("data-src", iframes[i].src);
    }
    iframes[i].setAttribute("src", "about:blank");
  }

  let body_style = getComputedStyle(document.body);
  let pages_container_width = parseInt(body_style.getPropertyValue("--pages_container_width"));
  let page_left_margin = parseInt(body_style.getPropertyValue("--page-left-margin"));
  let page_right_margin = parseInt(body_style.getPropertyValue("--page-right-margin"));
  let page_width = pages_container_width/2 - page_left_margin - page_right_margin;

  let interactives = document.querySelectorAll(".interactive");
  let w;
  let h;
  let scale;
  let src;
  let new_iframe;
  let new_expand;
  let window_size;
  let margin = 30;
  for (let i=0, l=interactives.length; i<l; i++) {
    w = parseInt(interactives[i].getAttribute("width") || 0);
    h = parseInt(interactives[i].getAttribute("height") || 0);
    scale = parseInt( interactives[i].getAttribute("scale") || 100 ) / 100;
    src = interactives[i].getAttribute("src") || "";
    window_size = interactives[i].getAttribute("window-size") || false;

    interactives[i].setAttribute("style", `width:${w * ((page_width-margin)*scale)/w + margin}px; height:${h * ((page_width-margin)*scale)/w + margin}px;`);
    
    if (! (((window.hasOwnProperty) && (window.hasOwnProperty("ontouchstart"))) || ("ontouchstart" in window))) {
      interactives[i].style.overflow = "hidden";
    }
    
    new_iframe = document.createElement("iframe");
    new_iframe.setAttribute("width", w * ((page_width-margin)*scale)/w);
    new_iframe.setAttribute("height", h * ((page_width-margin)*scale)/w);
    new_iframe.setAttribute("data-src", src);
    new_iframe.setAttribute("src", "about:blank");

    new_expand = document.createElement("div");
    // new_expand.setAttribute("style", "position:relative; z-index:1000000;");
    new_expand.setAttribute("style", "position:relative; top:-15px; z-index:1000;")

    let btn = document.createElement("button");
    btn.className = "btn_ampliar";
    new_expand.appendChild(btn);

    if (window_size) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    new_expand.onclick = new Function("", `openInteractive("${src}", ${w}, ${h+40});return 0;`);

    // interactives[i].parentNode.insertBefore(new_expand, interactives[i]);
    interactives[i].appendChild(new_expand);
    interactives[i].appendChild(new_iframe);
  }

  // make foot notes
  let el;
  let footnote_list = document.querySelectorAll(".footnote");
  let footnote_parent_page;
  let footnote_container;
  let footnote_number;

  for (let i=0, l=footnote_list.length; i<l; i++) {
    el = footnote_list[i];
    footnote_parent_page = el;
    while(footnote_parent_page.className !== "page") {
      footnote_parent_page = footnote_parent_page.parentNode
    }

    footnote_number = document.createElement("sup");
    footnote_number.textContent = i+1;
    el.parentNode.replaceChild(footnote_number, el);
    el.setAttribute("number", i+1);

    footnote_container = footnote_parent_page.querySelector(".footnote_container");
    if (!footnote_container) {
      footnote_container = footnote_parent_page.appendChild( document.createElement("div") );
      footnote_container.className = "footnote_container";
    }
    footnote_container.appendChild(el);
  }
});

window.addEventListener("load", function(evt) {
  let current_page = 0;

  let book_container = document.getElementById("book_container");

  let body_style = getComputedStyle(document.body);

  let page_viewer = book_container.appendChild( document.createElement("div") );
  let pages_container = document.getElementById("pages_container");
  page_viewer.appendChild(pages_container);

  let pages = pages_container.querySelectorAll(".page");

  let pages_container_width = parseInt(body_style.getPropertyValue("--pages_container_width"));
  let pages_container_height = parseInt(body_style.getPropertyValue("--pages_container_height"));

  let back = document.getElementById("btn_back_page");
  let next = document.getElementById("btn_next_page");

  let toc_btn = document.getElementById("go_to_table_of_content");

  page_viewer.setAttribute("style", `position:absolute; width:${pages_container_width}px; height:${pages_container_height}px; transform-origin: 0 0 0; overflow:hidden;`);

  pages_container.setAttribute("style", `position:absolute; width:${pages*100}%; height:${pages_container_height}px; display:flex; transition: all 0.3s; -webkit-transition: all 0.3s;`); 

  let orientation = LANDSCAPE;
  let nav_btn_size = 2.65;
  window.addEventListener("resize", resize);
  function resize(evt) {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let tmp_w;
    
    if (w > h) {
      tmp_w = pages_container_width;
      orientation = LANDSCAPE;
      back.style.width = next.style.width = `${nav_btn_size}vw`;
      toc_btn.style.width = toc_btn.style.height = `${nav_btn_size}vw`;
    }
    else {
      tmp_w = pages_container_width/2;
      orientation = PORTRAIT;
      back.style.width = next.style.width = `${nav_btn_size}vh`;
      toc_btn.style.width = toc_btn.style.height = `${nav_btn_size}vh`;
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


  /** add the page numbers */
  let init_page_num = 0;
  let arabic_number_page = Infinity;
  let tmp_num;
  for (let i=0; i<pages.length; i++) {
    if (pages[i].hasAttribute("init-page-num")) {
      init_page_num = i;
    }
    if (pages[i].hasAttribute("num-type-arabic")) {
      arabic_number_page = i;
    }
  }
  for (let i=0; i<pages.length; i++) {
    if ((i >= init_page_num) && (!pages[i].hasAttribute("num"))) {
      tmp_num = pages[i].appendChild( document.createElement("div") );

      if (i < arabic_number_page) {
        tmp_num.textContent = toRoman((i - init_page_num) +1);
      }
      else {
        tmp_num.textContent = (i - init_page_num) +1;
      }

      tmp_num.className = "page_number";
    }
  }

  /** add the back and next actions to the buttons */
  let inc;
  back.addEventListener("click", function(evt) {
    inc = (orientation === LANDSCAPE) ? 2 : 1;
    goToPage(Math.max(current_page-inc, 0));
  });
  next.addEventListener("click", function(evt) {
    inc = (orientation === LANDSCAPE) ? 2 : 1;
    goToPage(Math.min(current_page+inc, pages.length-1));
  });

  function goToPage(new_page) {
    if ( (orientation === PORTRAIT) && (new_page === 0) ) {
      new_page = 1;
    }
    if ( (orientation === LANDSCAPE) && (new_page % 2) ) {
      new_page--;
    }

    // get the iframes in the current page
    let last_iframes = [];
    for (let i=current_page-2; i<current_page+4; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].iframes) {
          pages[i].iframes = Array.from(pages[i].querySelectorAll("iframe"));
        }
        last_iframes = last_iframes.concat(pages[i].iframes);
      }
    }
    // get the videos in the current page
    let last_videos = [];
    for (let i=current_page; i<current_page+2; i++) {
      if ((i >= 0) && (i < pages.length)) {
        if (!pages[i].videos) {
          pages[i].videos = Array.from(pages[i].querySelectorAll("video"));
        }
        last_videos = last_videos.concat(pages[i].videos);
      }
    }

    // change the current page
    current_page = new_page;

    // get the iframes in the next page (the new current page)
    let next_iframes = [];
    for (let i=current_page-2; i<current_page+4; i++) {
      if ((i >= 0) && (i < pages.length)) {
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

    // move the pages
    pages_container.style.left = -(pages_container_width/2 * current_page) + "px";
  }
  goToPage(current_page);

  /** */
  window.goToPage = function(num) {
    goToPage( (orientation === LANDSCAPE) ? parseInt(parseInt((num+2) / 2) * 2) : num+2 );
  }

  /** */
  window.openImage = function(img) {
    window.open(img.src, "_blank", `scrollbars=yes,resizable=yes,location=0,titlebar=0,menubar=0,status=0,toolbar=0,left=${(screen.availWidth-img.naturalWidth)/2},top=${(screen.availHeight-img.naturalHeight)/2},width=${img.naturalWidth},height=${img.naturalHeight}`);
  }

  /** */
  window.openInteractive = function(href, width, height) {
    window.open(href, "_blank", `scrollbars=yes,resizable=yes,location=0,titlebar=0,menubar=0,status=0,toolbar=0,left=${(screen.availWidth-width)/2},top=${(screen.availHeight-height)/2},width=${width},height=${height}`);
  }

  /** */
  toc_btn.addEventListener("click", function(evt) {
    window.goToPage(3);
  });
  

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


  /** */
  document.getElementById("book_loader_container").style.display = "none";
});

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
