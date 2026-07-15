const data=window.CARDIOLOGY_DATA||{hospitals:[],regions:[]};
const $=s=>document.querySelector(s);const PAGE=30;
let state={query:"",region:"전체",sigungu:"전체",dong:"전체",type:"전체",dept:"전체",visible:PAGE};
const short=n=>n.replace("특별자치시","").replace("특별자치도","").replace("특별시","").replace("광역시","").replace("도","");
const safeUrl=v=>/^https?:\/\//i.test(v||"")?v:`https://${v}`;
const unique=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko-KR"));
function options(el,values,keep="전체"){el.innerHTML=`<option value="전체">전체</option>`+values.map(v=>`<option${v===keep?" selected":""}>${v}</option>`).join("")}
function init(){
  $("#totalCount").textContent=data.hospitals.length.toLocaleString("ko-KR");
  options($("#region"),data.regions.map(x=>x.name));options($("#type"),unique(data.hospitals.map(x=>x.type)));
  $("#regionGrid").innerHTML=data.regions.map(x=>`<button data-region="${x.name}"><b>${short(x.name)}</b><span>${x.count.toLocaleString("ko-KR")}곳</span></button>`).join("");
  $("#regionGrid").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;setRegion(b.dataset.region);location.hash="finder"});
  $("#query").addEventListener("input",e=>{state.query=e.target.value.trim().toLowerCase();state.visible=PAGE;render()});
  $("#region").addEventListener("change",e=>setRegion(e.target.value));
  $("#sigungu").addEventListener("change",e=>{state.sigungu=e.target.value;state.dong="전체";state.visible=PAGE;syncDongs();render()});
  $("#dong").addEventListener("change",e=>{state.dong=e.target.value;state.visible=PAGE;render()});
  $("#type").addEventListener("change",e=>{state.type=e.target.value;state.visible=PAGE;render()});
  $("#dept").addEventListener("change",e=>{state.dept=e.target.value;state.visible=PAGE;render()});
  $("#resetBtn").addEventListener("click",reset);$("#moreBtn").addEventListener("click",()=>{state.visible+=PAGE;render()});
  $("#modalClose").addEventListener("click",closeModal);$("#modalWrap").addEventListener("click",e=>{if(e.target.id==="modalWrap")closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});render();
}
function setRegion(value){state.region=value;state.sigungu="전체";state.dong="전체";state.visible=PAGE;$("#region").value=value;syncDistricts();render()}
function syncDistricts(){const list=data.hospitals.filter(x=>state.region==="전체"||x.region===state.region);options($("#sigungu"),unique(list.map(x=>x.sigungu)));$("#sigungu").disabled=state.region==="전체";syncDongs()}
function syncDongs(){const list=data.hospitals.filter(x=>(state.region==="전체"||x.region===state.region)&&(state.sigungu==="전체"||x.sigungu===state.sigungu));options($("#dong"),unique(list.map(x=>x.dong)));$("#dong").disabled=state.sigungu==="전체"}
function filtered(){return data.hospitals.filter(x=>{const q=state.query;return(!q||[x.name,x.address,x.sigungu,x.dong,x.depts].some(v=>(v||"").toLowerCase().includes(q)))&&(state.region==="전체"||x.region===state.region)&&(state.sigungu==="전체"||x.sigungu===state.sigungu)&&(state.dong==="전체"||x.dong===state.dong)&&(state.type==="전체"||x.type===state.type)&&(state.dept==="전체"||x.depts.includes(state.dept))})}
function render(){
  const list=filtered();$("#resultCount").textContent=list.length.toLocaleString("ko-KR");
  document.querySelectorAll("#regionGrid button").forEach(b=>b.classList.toggle("active",b.dataset.region===state.region));
  $("#hospitalList").innerHTML=list.length?list.slice(0,state.visible).map(card).join(""):`<div class="empty">조건에 맞는 기관이 없습니다.</div>`;
  $("#hospitalList").querySelectorAll("[data-detail]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.detail)));
  $("#moreBtn").hidden=state.visible>=list.length;$("#moreBtn").textContent=`의료기관 더 보기 (${Math.min(state.visible,list.length)} / ${list.length})`;
}
function card(x){return `<article class="card"><div><div class="badges"><span>${x.sigungu}${x.dong?` · ${x.dong}`:""}</span><span>${x.type}</span><span class="${x.official?"official":""}">${x.designation}</span></div><h3>${x.name}</h3><p class="care">${x.care}</p><p class="address">${x.address}</p><p class="evidence">${x.evidence}</p></div><div class="actions">${x.phone?`<a href="tel:${x.phone}">전화번호</a>`:""}<a target="_blank" rel="noreferrer" href="https://map.kakao.com/link/search/${encodeURIComponent(x.name+" "+x.address)}">지도 보기</a>${x.url?`<a target="_blank" rel="noreferrer" href="${safeUrl(x.url)}">홈페이지</a>`:""}<button class="detail" data-detail="${x.id}">상세 보기</button></div></article>`}
function openModal(id){const x=data.hospitals.find(h=>h.id===id);if(!x)return;$("#modalTitle").textContent=x.name;$("#modalMeta").textContent=`${x.sigungu}${x.dong?` · ${x.dong}`:""} · ${x.type}`;$("#modalBadge").textContent=`✓ ${x.official?"공식 지정 확인 기관":"진료과목 확인 기관"}`;$("#modalActions").innerHTML=`${x.phone?`<a href="tel:${x.phone}">☎ 전화번호</a>`:""}<a target="_blank" href="https://map.naver.com/p/search/${encodeURIComponent(x.name+" "+x.address)}">네이버 지도 ↗</a><a target="_blank" href="https://map.kakao.com/link/search/${encodeURIComponent(x.name+" "+x.address)}">카카오맵 ↗</a>${x.url?`<a target="_blank" href="${safeUrl(x.url)}">홈페이지 ↗</a>`:""}<button id="copyBtn">주소 복사</button>`;$("#modalDetails").innerHTML=[["기관 구분",x.designation],["선정 근거",x.evidence],["진료과목",x.depts],["심장초음파",x.echo],["전체 전문의 수",`${x.specialists}명 (순환기내과 전문의 수 아님)`],["대표전화",x.phone||"등록 정보 없음"],["주소",x.address],["자료 기준",x.source]].map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join("");$("#modalWrap").hidden=false;document.body.style.overflow="hidden";const c=$("#copyBtn");if(c)c.onclick=()=>navigator.clipboard.writeText(x.address)}
function closeModal(){$("#modalWrap").hidden=true;document.body.style.overflow=""}
function reset(){state={query:"",region:"전체",sigungu:"전체",dong:"전체",type:"전체",dept:"전체",visible:PAGE};$("#query").value="";$("#region").value="전체";$("#type").value="전체";$("#dept").value="전체";syncDistricts();render()}
document.addEventListener("DOMContentLoaded",init);
