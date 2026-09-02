(() => {
  const NS="http://www.w3.org/2000/svg";
  const nodes=[
    {id:"keter",name:"Keter",he:"כֶּתֶר",kind:"INPUT / INTENTION",x:310,y:65,duty:"Intent and manifest",role:"Receives the program and binds it to an explicit execution manifest."},
    {id:"chokhmah",name:"Chokhmah",he:"חָכְמָה",kind:"GENERATIVE ENGINE",x:145,y:205,duty:"Candidate generation",role:"Generates possible interpretations and plans without granting any authority to act."},
    {id:"binah",name:"Binah",he:"בִּינָה",kind:"ANALYTICAL ENGINE",x:475,y:205,duty:"Schema and analysis",role:"Constrains candidates with types, schemas, evidence requirements, and structural analysis."},
    {id:"daat",name:"Da’at",he:"דַּעַת",kind:"VERIFICATION CROSSING",x:310,y:315,duty:"Verify and record provenance",role:"Checks claims, binds evidence to its source, and preserves unresolved disagreement."},
    {id:"chesed",name:"Chesed",he:"חֶסֶד",kind:"EMPATHY / RETRIEVAL",x:145,y:435,duty:"Permitted retrieval",role:"Retrieves allowed public information and broadens the field of useful possibilities."},
    {id:"gevurah",name:"Gevurah",he:"גְּבוּרָה",kind:"POLICY / JUDGMENT",x:475,y:435,duty:"Limits and denials",role:"Enforces capability grants, privacy boundaries, resource budgets, and explicit denials."},
    {id:"tiferet",name:"Tiferet",he:"תִּפְאֶרֶת",kind:"INTEGRATION",x:310,y:535,duty:"Balanced resolution",role:"Integrates viable candidates while keeping conflicts and uncertainty visible."},
    {id:"netzach",name:"Netzach",he:"נֶצַח",kind:"DISTRIBUTION",x:145,y:650,duty:"Deterministic tasks",role:"Distributes deterministic work only when the manifest grants the required capability."},
    {id:"hod",name:"Hod",he:"הוֹד",kind:"COMPILATION",x:475,y:650,duty:"Compile QEC IR",role:"Compiles allowlisted instructions into QEC intermediate representation or a safe target AST."},
    {id:"yesod",name:"Yesod",he:"יְסוֹד",kind:"STATE / MEMORY",x:310,y:755,duty:"Trace and replay",role:"Records state transitions, hashes, events, and the information required for deterministic replay."},
    {id:"malkhut",name:"Malkhut",he:"מַלְכוּת",kind:"OUTPUT / RESOLUTION",x:310,y:865,duty:"Sandboxed result",role:"Executes within the sandbox and returns the result with provenance, warnings, and budgets used."}
  ];
  const edges=[["keter","chokhmah"],["keter","binah"],["keter","daat"],["chokhmah","binah"],["chokhmah","daat"],["binah","daat"],["chokhmah","chesed"],["daat","chesed"],["daat","gevurah"],["chesed","gevurah"],["chesed","tiferet"],["gevurah","tiferet"],["daat","tiferet"],["chesed","netzach"],["gevurah","hod"],["tiferet","netzach"],["tiferet","hod"],["netzach","hod"],["netzach","yesod"],["hod","yesod"],["tiferet","yesod"],["yesod","malkhut"]];
  const byId=Object.fromEntries(nodes.map(n=>[n.id,n])),pathLayer=document.querySelector("#path-layer"),nodeLayer=document.querySelector("#node-layer");
  edges.forEach(([a,b])=>{const line=document.createElementNS(NS,"line");for(const [key,val] of Object.entries({x1:byId[a].x,y1:byId[a].y,x2:byId[b].x,y2:byId[b].y}))line.setAttribute(key,val);line.dataset.edge=a+"-"+b;line.setAttribute("class","qec-path");pathLayer.append(line)});
  const select=id=>{const n=byId[id];document.querySelectorAll(".qec-node").forEach(el=>el.classList.toggle("selected",el.dataset.id===id));for(const [selector,value] of [["#stage-kind",n.kind],["#stage-hebrew",n.he],["#stage-name",n.name],["#stage-role",n.role],["#stage-duty",n.duty]])document.querySelector(selector).textContent=value};
  nodes.forEach(n=>{const g=document.createElementNS(NS,"g");g.setAttribute("class","qec-node");g.dataset.id=n.id;g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label",n.name+": "+n.duty);g.setAttribute("transform",`translate(${n.x} ${n.y})`);g.innerHTML=`<circle r="58"></circle><text class="node-he" y="-7" lang="he">${n.he}</text><text class="node-en" y="24">${n.name.toUpperCase()}</text>`;g.addEventListener("click",()=>select(n.id));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(n.id)}});nodeLayer.append(g)});
  select("keter");
  const traceOrder=["keter","chokhmah","binah","daat","chesed","gevurah","tiferet","netzach","hod","yesod","malkhut"],trace=document.querySelector("#trace-strip");
  traceOrder.forEach(id=>{const s=document.createElement("span");s.className="trace-step";s.dataset.id=id;s.textContent=byId[id].name;trace.append(s)});
  document.querySelector("#run-demo").addEventListener("click",async e=>{
    e.currentTarget.disabled=true;
    const result=globalThis.QECCore.execute("יִ $r1, 5");
    document.querySelectorAll(".trace-step").forEach(x=>x.classList.remove("done"));
    document.querySelectorAll(".qec-path").forEach(x=>x.classList.remove("active"));
    for(let i=0;i<result.events.length;i++){
      const event=result.events[i],id=event.stage;select(id);
      const node=document.querySelector(`.qec-node[data-id="${id}"]`);
      node.classList.add("running");
      document.querySelector(`.trace-step[data-id="${id}"]`).classList.add("done");
      if(i){const prev=result.events[i-1].stage;document.querySelectorAll(".qec-path").forEach(p=>{if(p.dataset.edge===prev+"-"+id||p.dataset.edge===id+"-"+prev)p.classList.add("active")})}
      document.querySelector("#stage-state").textContent=event.status;
      await new Promise(r=>setTimeout(r,260));node.classList.remove("running");
    }
    document.querySelector("#stage-state").textContent=result.ok?`Resolved: ${result.events.at(-1).data.register} = ${result.events.at(-1).data.result}`:"Denied";
    e.currentTarget.disabled=false;
  });
  const gates=globalThis.QECCore.GATES.map(g=>({he:g.letters,name:g.names}));
  const grid=document.querySelector("#gate-grid"),count=document.querySelector("#gate-count"),render=q=>{const term=q.trim().toLowerCase(),shown=gates.filter(g=>!term||g.he.includes(term)||g.name.toLowerCase().includes(term));grid.replaceChildren(...shown.map(g=>{const a=document.createElement("article");a.className="gate-card-qec";a.innerHTML=`<b lang="he" dir="rtl">${g.he}</b><small>${g.name}</small>`;return a}));count.textContent=shown.length};
  document.querySelector("#gate-search").addEventListener("input",e=>render(e.target.value));render("");
})();
