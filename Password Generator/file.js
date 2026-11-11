(function(){
  var $ = function(id){return document.getElementById(id)};
  var SETS = {
    lower:"abcdefghijklmnopqrstuvwxyz",
    upper:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    nums:"0123456789",
    syms:"!@#$%^&*()-_=+[]{};:,.?/~"
  };
  var AMBIG = /[O0Il1|]/g;
  var current = "";

  // Unbiased random integer in [0, max) using rejection sampling
  function randInt(max){
    var limit = Math.floor(0x100000000 / max) * max, buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }

  function pools(){
    var skip = $("ambig").checked, out = [];
    ["lower","upper","nums","syms"].forEach(function(k){
      if ($(k).checked){
        var s = SETS[k]; if (skip) s = s.replace(AMBIG,"");
        if (s) out.push(s);
      }
    });
    return out;
  }

  function generate(){
    var p = pools(), len = +$("len").value;
    if (!p.length){ current=""; $("pw").textContent=""; setMeter(0,0); say("Select at least one character type."); return; }
    var all = p.join(""), chars = [];
    // guarantee one character from each selected type
    p.forEach(function(s){ chars.push(s[randInt(s.length)]); });
    while (chars.length < len) chars.push(all[randInt(all.length)]);
    chars.length = len;
    // Fisher–Yates shuffle
    for (var i = chars.length-1; i > 0; i--){
      var j = randInt(i+1), t = chars[i]; chars[i]=chars[j]; chars[j]=t;
    }
    current = chars.join("");
    $("pw").textContent = current;
    setMeter(len * Math.log2(all.length), len);
    say("");
  }

  function setMeter(bits){
    var pct = Math.min(100, bits/128*100), name, color;
    if (bits < 40){ name="Weak"; color="var(--weak)"; }
    else if (bits < 60){ name="Fair"; color="var(--ok)"; }
    else if (bits < 80){ name="Good"; color="var(--strong)"; }
    else { name="Strong"; color="var(--strong)"; }
    $("fill").style.width = pct+"%"; $("fill").style.background = color;
    $("label").textContent = bits ? name : "Strength";
    $("bits").textContent = bits ? Math.round(bits)+" bits of entropy" : "";
  }

  function say(t){ $("msg").textContent = t; }

  function fallbackCopy(text){
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch(e){}
    document.body.removeChild(ta);
    return ok;
  }

  function copy(){
    if (!current){ say("Generate a password first."); return; }
    var done = function(ok){ say(ok ? "Copied to clipboard." : "Couldn’t copy. Select the password and copy it manually."); };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(current).then(function(){done(true)}, function(){done(fallbackCopy(current))});
    } else done(fallbackCopy(current));
  }

  $("gen").addEventListener("click", generate);
  $("copy").addEventListener("click", copy);
  $("len").addEventListener("input", function(){ $("lenOut").textContent = this.value; generate(); });
  ["lower","upper","nums","syms","ambig"].forEach(function(k){ $(k).addEventListener("change", generate); });
  generate();
})();