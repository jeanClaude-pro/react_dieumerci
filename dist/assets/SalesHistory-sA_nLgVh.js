import{h as Ot,q as zt,r as l,s as N,p as e,e as Ve,P as Le,B as Vt,d as Lt,k as qt,E as Bt,U as _t,j as Ht}from"./index-CgI5oCu1.js";import{E as Wt}from"./jspdf.es.min-Dz14Xi8a.js";import{Q as Qt}from"./browser-DIRwO7eH.js";import{i as qe,e as Be,h as _e,f as He,d as Yt,j as Jt,g as Gt,k as Zt}from"./salePricing-B6Q10MKn.js";import{F as We,P as Qe}from"./printer-BCJwdJyL.js";import{S as Kt}from"./search-BQ97CW9_.js";import{F as K}from"./file-text-BIFn2sK2.js";import{D as pe}from"./download-DJAOJML0.js";import{C as Xt}from"./calendar-soTGq86o.js";import{C as Ye}from"./chevron-down-DXp4jNbS.js";import{R as X}from"./refresh-cw-WbVeyKSM.js";import{H as ue}from"./history-C6lL005J.js";import{S as he}from"./square-pen-CIX-cVW9.js";import{T as Je}from"./trash-2-DYZhbwlS.js";import{P as Ge}from"./plus-DGFclMry.js";const es=[["path",{d:"M5 12h14",key:"1ays0h"}]],ge=Ot("minus",es),ee=()=>{const m=new Date,g=m.getFullYear(),C=String(m.getMonth()+1).padStart(2,"0"),R=String(m.getDate()).padStart(2,"0");return`${g}-${C}-${R}`},te=()=>{const m=new Date,g=m.getFullYear(),C=String(m.getMonth()+1).padStart(2,"0");return`${g}-${C}`},V=()=>new Date().getFullYear(),ts=new Date("2026-09-03T22:00:00.000Z").getTime(),T=m=>new Date(m.createdAt).getTime()<ts,L=m=>T(m)||m.receiptVerification?.paymentStatus==="approved",q=m=>T(m)||m.receiptVerification?.exitVerification?.verified===!0;function fs(){const{token:m}=zt(),g=l.useCallback(()=>m||localStorage.getItem("token")||"",[m]),C=l.useRef(()=>{}),R=l.useRef(()=>{}),[Ze,Ke]=l.useState([]),[w,Xe]=l.useState([]),[F,et]=l.useState({shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",receiptFooter:"Merci pour votre confiance ! À bientôt."}),[se,$]=l.useState(!0),[x,be]=l.useState(""),[i,tt]=l.useState(null),[st,B]=l.useState(!1),[at,fe]=l.useState(!1),[f,ye]=l.useState(null),[d,u]=l.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),[je,D]=l.useState(null),[_,c]=l.useState(null),[H,ve]=l.useState(!1),[W,Ne]=l.useState(null),[Q,ae]=l.useState(!1),re=t=>!!W&&t.saleEditApproval?.status!=="pending",[S,we]=l.useState("today"),[n,ne]=l.useState({from:"",to:"",date:ee(),year:V().toString(),month:te().split("-")[1],type:"",status:"",customerPhone:"",controlStatus:""}),[b,Se]=l.useState(!1),[ke,rt]=l.useState([]),[y,nt]=l.useState(null),[it,ie]=l.useState(!1),[Ce,ot]=l.useState(null),[A,lt]=l.useState(null),[M,dt]=l.useState(null),[Y,ct]=l.useState(!1),[J,mt]=l.useState(!1),[Ae,oe]=l.useState(1),[E,xt]=l.useState(null),[U,pt]=l.useState(null),[P,Ee]=l.useState(!1),[k,le]=l.useState(new Set),[Te,$e]=l.useState(!1);l.useEffect(()=>{ut(),O(),ce(),fetch(`${N}/settings/receipt`,{headers:{Authorization:`Bearer ${g()}`}}).then(s=>s.ok?s.json():null).then(s=>{s&&et({shopName:s.shopName||"ETS. DIEU MERCI",shopAddress:s.shopAddress||"",shopNumber:s.shopNumber||"",shopRegistration:s.shopRegistration||"",receiptFooter:s.receiptFooter||""})}).catch(()=>{});const t=()=>{C.current(),R.current()};return window.addEventListener("salesUpdated",t),()=>{window.removeEventListener("salesUpdated",t)}},[]),l.useEffect(()=>{Object.keys(n).length>0&&O()},[n,Ae,x]),l.useEffect(()=>{De()},[n,x]),l.useEffect(()=>{oe(1)},[n,x]);const ut=async()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);Ne(a),ae(a.role==="admin");return}const s=await fetch(`${N}/users/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(s.ok){const a=await s.json();Ne(a),ae(a.role==="admin"),localStorage.setItem("user",JSON.stringify(a))}}catch(t){console.error("Error fetching user data:",t),ae(!1)}},ht=t=>t.filter(s=>{const r=!["expense","depense"].includes(s.status?.toLowerCase()),o=s.saleId&&s.customer&&s.items;return r&&o}),gt=()=>{const t=new URLSearchParams;switch(t.set("page",String(Ae)),t.set("limit","50"),t.set("type","sale"),S){case"custom":n.from&&t.append("from",n.from),n.to&&t.append("to",n.to);break;case"day":n.date&&t.append("date",n.date);break;case"month":n.year&&t.append("year",n.year),n.month&&t.append("month",n.month);break;case"year":n.year&&t.append("year",n.year);break}return n.status&&t.append("status",n.status),n.customerPhone&&t.append("customerPhone",n.customerPhone),n.controlStatus&&t.append("controlStatus",n.controlStatus),x.trim()&&t.append("search",x.trim()),t.toString()},O=async()=>{try{$(!0),c(null);const t=gt(),s=`${N}/sales${t?`?${t}`:""}`;console.log("Fetching sales from:",s);const a=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(a.ok){const r=await a.json();if(r.success&&r.data&&Array.isArray(r.data)){const o=r.data;console.log(`Fetched ${o.length} sales from API`),console.log("Timeframe metadata:",r.timeframe),console.log("Summary stats:",r.summary);const v=ht(o);console.log(`After filtering: ${v.length} valid sales`),Ke(v),xt(r.pagination||null),ot(r.timeframe),lt(r.summary),dt(r.filtersApplied),bt(v)}else console.warn("Unexpected sales data structure:",r),c("Unexpected response format from server")}else{console.error("Sales fetch failed:",a.status);const r=await a.text();c(`Failed to load sales: ${a.status} ${r}`)}}catch(t){console.error("Error loading sales:",t),c("Failed to load sales. Please check your connection.")}finally{$(!1)}};C.current=O;const bt=t=>{const a=t.filter(r=>r.editHistory&&r.editHistory.length>0||r.editedBy).sort((r,o)=>{const v=r.editedAt?new Date(r.editedAt).getTime():new Date(r.updatedAt).getTime();return(o.editedAt?new Date(o.editedAt).getTime():new Date(o.updatedAt).getTime())-v});rt(a)},ft=t=>{we(t);const s={...n};switch(t){case"today":s.date=ee(),s.from="",s.to="",s.year=V().toString(),s.month=te().split("-")[1];break;case"day":s.date=ee(),s.from="",s.to="";break;case"month":s.year=V().toString(),s.month=te().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=V().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),1);s.from=r.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}ne(s)},p=(t,s)=>{ne(a=>({...a,[t]:s}))},yt=()=>{ne({from:"",to:"",date:ee(),year:V().toString(),month:te().split("-")[1],type:"",status:"",customerPhone:"",controlStatus:""}),we("today"),Se(!1),be("")},G=t=>(t.type??"sale")==="sale"&&!["voided","corrected","refunded"].includes(t.status)&&!T(t)&&(!L(t)||!q(t)),jt=t=>{le(s=>{const a=new Set(s);return a.has(t)?a.delete(t):a.add(t),a})},Pe=()=>{le(t=>{const s=new Set(t);return I.filter(G).forEach(a=>s.add(a._id)),s})},de=()=>le(new Set),vt=async()=>{if(k.size!==0){$e(!0),c(null),D(null);try{const t=await fetch(`${N}/sales/receipt-control/admin-mark-complete`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify({saleIds:Array.from(k),reason:"Admin bulk override (SalesHistory)"})}),s=await t.json();if(!t.ok){c(s.error||"Échec de la mise à jour manuelle des reçus");return}D(`Reçus mis à jour : ${s.updated} · Déjà complets : ${s.alreadyComplete} · Rejetés : ${s.rejected}`),de(),C.current(),R.current()}catch(t){console.error("Admin override error:",t),c("Connexion au serveur impossible")}finally{$e(!1)}}},ce=async()=>{try{ve(!0);const t=await fetch(`${N}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),console.log("Processed products:",a.length),Xe(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{ve(!1)}},I=b?ke.filter(t=>t.saleId.toLowerCase().includes(x.toLowerCase())||t.customer.name.toLowerCase().includes(x.toLowerCase())||t.customer.phone.includes(x)||t.salesPerson&&t.salesPerson.toLowerCase().includes(x.toLowerCase())):Ze.filter(t=>t.saleId.toLowerCase().includes(x.toLowerCase())||t.customer.name.toLowerCase().includes(x.toLowerCase())||t.customer.phone.includes(x)||t.salesPerson&&t.salesPerson.toLowerCase().includes(x.toLowerCase())),j=t=>Ht(t),h=t=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(t),z=t=>`${new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(t)} FC`,Ie=(t,s)=>{const a=Yt(t,s);return`${Jt(t).toFixed(2)}$${a===void 0?"":` / ${z(a)}`}`},Re=(t,s)=>{const a=Gt(t,s);return`${qe(t).toFixed(2)}$${a===void 0?"":` / ${z(a)}`}`},Z=(t,s,a)=>{const r=Zt(t,s,a);return`${t.toFixed(2)}$${r===void 0?"":` / ${z(r)}`}`},Nt=t=>Be(t)==="FC"?z(_e(t)):h(_e(t)),wt=t=>Be(t)==="FC"?z(He(t)):h(He(t)),St=()=>{if(Ce)return Ce.description;switch(S){case"today":return"Today";case"day":return n.date?`Day: ${n.date}`:"Today";case"month":return n.year&&n.month?`Month: ${n.year}-${n.month.padStart(2,"0")}`:"This month";case"year":return n.year?`Year: ${n.year}`:"This year";case"custom":return n.from&&n.to?`Range: ${n.from} to ${n.to}`:n.from?`From: ${n.from}`:n.to?`Until: ${n.to}`:"Custom range";default:return"Today"}},kt=t=>{nt(t),ie(!0)},Ct=t=>{if(!t.editHistory||t.editHistory.length===0)return null;const s=t.editHistory[t.editHistory.length-1],a=s.changes;return e.jsxs("div",{className:"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:[e.jsxs("h4",{className:"font-medium text-yellow-800 mb-2 flex items-center gap-2",children:[e.jsx(ue,{className:"w-4 h-4"}),"Dernière modification"]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Modifié par:"}),e.jsx("span",{className:"font-medium",children:s.editedBy||t.editedBy||"Unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Date de modification:"}),e.jsx("span",{className:"font-medium",children:j(s.editedAt||t.editedAt||t.updatedAt)})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Raison:"}),e.jsx("span",{className:"font-medium text-right",children:s.reason})]}),a&&Object.keys(a).length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-yellow-200",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"Changements:"}),Object.entries(a).map(([r,o])=>e.jsxs("div",{className:"mb-2 last:mb-0",children:[e.jsxs("div",{className:"font-medium text-yellow-700 capitalize",children:[r.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{className:"bg-red-50 p-2 rounded",children:[e.jsx("div",{className:"text-red-600 font-medium",children:"Avant:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(o.from)})]}),e.jsxs("div",{className:"bg-green-50 p-2 rounded",children:[e.jsx("div",{className:"text-green-600 font-medium",children:"Après:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(o.to)})]})]})]},r))]})]})]})},Fe=async t=>{let s=t.receiptToken;if(!s){const r=await fetch(`${N}/sales/${t._id}/receipt-token`,{headers:{Authorization:`Bearer ${g()}`}}),o=await r.json().catch(()=>({}));if(!r.ok||!o.receiptToken)throw new Error(o.message||"QR du reçu indisponible");s=o.receiptToken}if(!s)throw new Error("QR du reçu indisponible");const a=await Qt.toDataURL(s,{errorCorrectionLevel:"M",margin:4,width:320,color:{dark:"#000000",light:"#ffffff"}});return{receiptToken:s,qrDataUrl:a}},At=()=>{const t=new URLSearchParams;switch(S){case"custom":n.from&&t.set("from",n.from),n.to&&t.set("to",n.to);break;case"day":n.date&&t.set("date",n.date);break;case"month":n.year&&t.set("year",n.year),n.month&&t.set("month",n.month);break;case"year":n.year&&t.set("year",n.year);break}return n.customerPhone&&t.set("customerPhone",n.customerPhone),x.trim()&&t.set("search",x.trim()),t.toString()},De=async()=>{try{Ee(!1);const t=At(),s=await fetch(`${N}/sales/scan-stats${t?`?${t}`:""}`,{headers:{Authorization:`Bearer ${g()}`}});if(!s.ok)throw new Error(`Scan statistics request failed (${s.status})`);pt(await s.json())}catch(t){console.error("Error loading receipt-control statistics:",t),Ee(!0)}};R.current=De;const Me=async t=>{let s;try{({qrDataUrl:s}=await Fe(t))}catch(r){c(r instanceof Error?r.message:"QR du reçu indisponible");return}const a=window.open("","_blank","width=320,height=600");a&&(a.document.write(`
<html>
  <head>
    <title>Sale Receipt - ESC/POS</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0;
        padding: 0;
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/logo.jpeg');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section {
        font-weight: bold;
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
        color: #000;
      }
      .footer {
        text-align: center;
        margin-top: 2mm;
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .receipt-qr { text-align: center; margin: 2mm auto; padding: 1mm; background: #fff; }
      .receipt-qr img { width: 42mm; height: 42mm; image-rendering: pixelated; }
      .qr-promo { margin-top: 0.5mm; font-size: 9px; line-height: 1.15; text-align: center; }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt-container {
          border: none !important;
          box-shadow: none !important;
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${F.shopName}</strong></div>
        <div class="shop-details"><strong>${F.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${F.shopNumber}</strong></div>
        <div class="shop-details"><strong>${F.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${j(t.createdAt)}</strong></div>
        <div class="shop-details">RECU #: <strong>${t.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${t.customer.name.toUpperCase()}</strong></div>
        ${t.customer.phone?`<div class="customer-field">TELEPHONE: <strong>${t.customer.phone}</strong></div>`:""}
        ${t.customer.email?`<div class="customer-field">EMAIL: <strong>${t.customer.email}</strong></div>`:""}
      </div>
      
      <div class="receipt-title">ARTICLES ACHETES</div>

      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>

      <div class="items-section">
      ${t.items.map(r=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-quantity"><strong>${r.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${Ie(r,t.exchangeRate)} = ${Re(r,t.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${Z(t.subtotal,t.items,t.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${Z(t.total,t.items,t.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${t.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${(t.salesPerson||"Non spécifié").toUpperCase()}</strong>
      </div>
      
      <div class="receipt-qr"><img src="${s}" alt="QR de contrôle du paiement" /><div class="qr-promo"><div><strong>UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?</strong></div><div>Gestion, ventes, stock & bien plus</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>

      <div class="footer">
        <div class="thank-you"><strong>${F.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
        <div class="warning"><strong>Article non echangeable</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    <\/script>
  </body>
</html>
`),a.document.close())},Ue=async t=>{let s;try{({qrDataUrl:s}=await Fe(t))}catch(o){c(o instanceof Error?o.message:"QR du reçu indisponible");return}const a=new Wt;a.setFontSize(20),a.text("ETS. DIEU MERCI",105,10,{align:"center"}),a.setFontSize(10),a.text("<<Chez Dan Collection>>",105,15,{align:"center"}),a.setFontSize(12),a.text("RCCM: 14-A-017885",105,20,{align:"center"}),a.text("Tél: +243 977 771 421 / +243 853 549 102",105,25,{align:"center"}),a.text("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi",105,30,{align:"center"}),a.setFontSize(16),a.text("Reçu de vente",105,35,{align:"center"}),a.setFontSize(10),a.text(`Date: ${j(t.createdAt)}`,20,45),a.text(`Reçu #: ${t.saleId}`,20,52),a.text(`Payement: ${t.paymentMethod.toUpperCase()}`,20,59),a.text(`Statut: ${t.status.toUpperCase()}`,20,66),a.text(`Agent: ${t.salesPerson||"Non spécifié"}`,20,73),a.setFontSize(12),a.text("Information sur le client:",20,85),a.setFontSize(10),a.text(`Nom: ${t.customer.name}`,20,92),t.customer.phone&&a.text(`Phone: ${t.customer.phone}`,20,99),t.customer.email&&a.text(`Email: ${t.customer.email}`,20,106),a.setFontSize(12),a.text("Articles:",20,113),a.setFontSize(10);let r=120;t.items.forEach((o,v)=>{r>250&&(a.addPage(),r=20),a.text(`${v+1}. ${o.name}`,20,r),a.text(`Qté: ${o.quantity} x ${Ie(o,t.exchangeRate)} = ${Re(o,t.exchangeRate)}`,25,r+6),r+=15}),r+=7,a.text(`Sous-total: ${Z(t.subtotal,t.items,t.exchangeRate)}`,20,r),a.text(`Total: ${Z(t.total,t.items,t.exchangeRate)}`,20,r+5),a.addImage(s,"PNG",84,r+10,42,42),a.setFontSize(8),a.setFont("helvetica","bold"),a.text("UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?",105,r+56,{align:"center"}),a.setFont("helvetica","normal"),a.text("Gestion, ventes, stock & bien plus",105,r+60,{align:"center"}),a.setFont("helvetica","bold"),a.text("WhatsApp : +243 844 311 550",105,r+64,{align:"center"}),r+=53,a.setFontSize(10),a.text("Merci pour votre achat !",105,r+20,{align:"center"}),a.text("Les marchandises vendues ne sont ni reprises ni échangées.",105,r+30,{align:"center"}),a.text("À bientôt",105,r+40,{align:"center"}),a.save(`receipt-${t.saleId}.pdf`)},Et=t=>{tt(t),B(!0),c(null)},Oe=async t=>{if(t.status==="voided"||t.status==="corrected"){c("Cannot edit a voided or corrected sale");return}ye(t),u({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",isWalkIn:!!t.isWalkIn}),fe(!0),c(null),w.length===0&&await ce()},me=()=>{fe(!1),ye(null),u({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),c(null)},Tt=()=>{u(t=>({...t,isWalkIn:!t.isWalkIn,customer:t.isWalkIn?t.customer:{name:"",phone:"",email:""}}))},xe=(t,s)=>{if(s<1)return;const a=[...d.items];a[t].quantity=s,a[t].total=s*a[t].price,u(r=>({...r,items:a})),c(null)},$t=(t,s)=>{if(s<0)return;const a=[...d.items],r=a[t].exchangeRate??f?.exchangeRate;a[t]={...a[t],price:s,total:s*a[t].quantity,enteredPrice:s,enteredCurrency:"USD",priceUSD:s,priceFC:r?Math.round(s*r):void 0,exchangeRate:r},u(o=>({...o,items:a}))},Pt=t=>{const s=d.items.filter((a,r)=>r!==t);u(a=>({...a,items:s}))},It=()=>{if(w.length===0){c("No products available. Please refresh products first.");return}const t=w[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price,priceFC:f?.exchangeRate?Math.round(t.price*f.exchangeRate):void 0,exchangeRate:f?.exchangeRate,_id:`temp-${Date.now()}`};u(a=>({...a,items:[...a.items,s]}))},Rt=(t,s)=>{const a=w.find(v=>v._id===s);if(!a){c("Selected product not found");return}const r=[...d.items],o=r[t].exchangeRate??f?.exchangeRate;r[t]={...r[t],productId:s,name:a.name,price:a.price,total:a.price*r[t].quantity,enteredPrice:a.price,enteredCurrency:"USD",priceUSD:a.price,priceFC:o?Math.round(a.price*o):void 0,exchangeRate:o},u(v=>({...v,items:r})),c(null)},ze=()=>{const t=d.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},Ft=async()=>{if(f){if(d.items.length===0){c("Sale must contain at least one item");return}if(!d.isWalkIn&&(!d.customer.name||!d.customer.phone)){c("Customer name and phone are required");return}if(!d.reason){c("Please provide a reason for editing this sale");return}try{$(!0);const{subtotal:t,total:s}=ze(),a={customer:d.isWalkIn?{name:"Client de passage",phone:"",email:""}:d.customer,isWalkIn:d.isWalkIn,items:d.items.map(o=>({productId:o.productId,name:o.name,quantity:o.quantity,price:o.price,total:o.total,enteredPrice:o.enteredPrice,enteredCurrency:o.enteredCurrency,priceUSD:o.priceUSD,priceFC:o.priceFC,exchangeRate:o.exchangeRate})),subtotal:t,total:s,exchangeRate:f.exchangeRate,paymentMethod:d.paymentMethod,reason:d.reason,_id:f._id,saleId:f.saleId},r=await fetch(`${N}/sales/${f._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify(a)});if(r.ok){const o=await r.json();D(r.status===202?"Modification enregistrée — EN ATTENTE D'APPROBATION":o.message||"Vente mise à jour avec succès"),await O(),setTimeout(()=>{window.dispatchEvent(new Event("salesUpdated"))},1e3),me()}else{const o=await r.json();c(o.error||o.message||`Failed to update sale: ${r.status} ${r.statusText}`)}}catch(t){console.error("Error updating sale:",t),c("Failed to update sale. Please check your connection.")}finally{$(!1)}}},Dt=async t=>{if(t.status==="voided"){c("Sale is already voided");return}if(window.confirm(`Are you sure you want to void sale ${t.saleId}? This action cannot be undone.`))try{$(!0);const s=await fetch(`${N}/sales/${t._id}/void`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify({reason:"Sale voided by admin"})});if(s.ok)D("✅ Sale voided successfully"),await O(),B(!1);else{const a=await s.json();c(a.error||"Failed to void sale")}}catch(s){c("Failed to void sale"),console.error("Error voiding sale:",s)}finally{$(!1)}},{subtotal:Mt,total:Ut}=ze();return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4 overflow-auto",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Historique des ventes"}),e.jsx("p",{className:"text-gray-600",children:"Voir toutes les transactions et ventes passées"})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:()=>Se(!b),className:`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${b?"bg-blue-500 text-white border-blue-500 shadow-sm":"bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`,children:[e.jsx(We,{className:"w-4 h-4"}),b?"Toutes les ventes":"Ventes modifiées",b&&e.jsx("span",{className:"bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full",children:ke.length})]}),e.jsxs("div",{className:"relative",children:[e.jsx(Kt,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Search sales...",className:"pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:x,onChange:t=>be(t.target.value)})]})]})]}),Q&&A&&e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg border border-blue-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsxs("h3",{className:"text-lg font-semibold text-blue-900 flex items-center gap-2",children:[e.jsx(Ve,{className:"w-5 h-5"}),"Summary Statistics (Admin View)"]}),W&&e.jsxs("span",{className:"text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full",children:["Logged in as: ",W.name," (",W.role,")"]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Records"}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:A.totalRecords})]}),e.jsx(K,{className:"w-8 h-8 text-blue-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Revenue"}),e.jsx("p",{className:"text-2xl font-bold text-green-600",children:h(A.revenue)})]}),e.jsx(pe,{className:"w-8 h-8 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Expenses"}),e.jsx("p",{className:"text-2xl font-bold text-red-600",children:h(A.expenses)})]}),e.jsx(ge,{className:"w-8 h-8 text-red-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Net"}),e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:h(A.net)})]}),e.jsx(Le,{className:"w-8 h-8 text-blue-500"})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mt-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Sales"}),e.jsx("p",{className:"text-xl font-bold text-green-700",children:A.salesCount})]}),e.jsx(K,{className:"w-6 h-6 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Expenses"}),e.jsx("p",{className:"text-xl font-bold text-red-700",children:A.expensesCount})]}),e.jsx(ge,{className:"w-6 h-6 text-red-500"})]})})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 lg:grid-cols-5",children:[e.jsxs("button",{type:"button",onClick:()=>p("controlStatus",""),className:`rounded-lg border p-4 text-left transition-colors ${n.controlStatus===""?"border-gray-400 bg-gray-100 ring-2 ring-gray-300":"border-gray-200 bg-white hover:bg-gray-50"}`,children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Tous"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-gray-900",children:P?"—":U?.total??"…"})]}),e.jsx("button",{type:"button",onClick:()=>p("controlStatus","payment_pending"),title:"Ventes dont le paiement n'a pas encore été scanné/validé",className:`rounded-lg border p-4 text-left transition-colors ${n.controlStatus==="payment_pending"?"border-amber-400 bg-amber-100 ring-2 ring-amber-300":"border-amber-200 bg-amber-50 hover:bg-amber-100"}`,children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-amber-800",children:"Non validés"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-amber-950",children:P?"—":U?.paymentPending??"…"})]}),e.jsx(Vt,{className:"h-7 w-7 text-amber-600"})]})}),e.jsx("button",{type:"button",onClick:()=>p("controlStatus","exit_unverified"),title:"Paiement approuvé mais sortie pas encore contrôlée",className:`rounded-lg border p-4 text-left transition-colors ${n.controlStatus==="exit_unverified"?"border-orange-400 bg-orange-100 ring-2 ring-orange-300":"border-orange-200 bg-orange-50 hover:bg-orange-100"}`,children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-orange-800",children:"Non contrôlés"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-orange-950",children:P?"—":U?.awaitingExitControl??"…"})]}),e.jsx(Lt,{className:"h-7 w-7 text-orange-600"})]})}),e.jsxs("button",{type:"button",onClick:()=>p("controlStatus","payment_approved"),className:`rounded-lg border p-4 text-left transition-colors ${n.controlStatus==="payment_approved"?"border-emerald-400 bg-emerald-100 ring-2 ring-emerald-300":"border-emerald-200 bg-emerald-50 hover:bg-emerald-100"}`,children:[e.jsx("p",{className:"text-sm font-medium text-emerald-800",children:"Validés"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-emerald-950",children:P?"—":U?.paymentApproved??"…"})]}),e.jsxs("button",{type:"button",onClick:()=>p("controlStatus","exit_verified"),className:`rounded-lg border p-4 text-left transition-colors ${n.controlStatus==="exit_verified"?"border-blue-400 bg-blue-100 ring-2 ring-blue-300":"border-blue-200 bg-blue-50 hover:bg-blue-100"}`,children:[e.jsx("p",{className:"text-sm font-medium text-blue-800",children:"Contrôlés"}),e.jsx("p",{className:"mt-1 text-2xl font-bold text-blue-950",children:P?"—":U?.exitControlled??"…"})]}),P&&e.jsx("p",{className:"text-sm text-amber-700 col-span-2 lg:col-span-5",children:"Statistiques de contrôle temporairement indisponibles."})]}),e.jsxs("div",{className:"bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(Xt,{className:"w-4 h-4 sm:w-5 sm:h-5"}),b?"Ventes modifiées":"Toutes les ventes"," - ",St()]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{onClick:()=>ct(!Y),className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(We,{className:"w-4 h-4"}),Y?"Hide Filters":"Show Filters",e.jsx(Ye,{className:`w-4 h-4 transition-transform ${Y?"rotate-180":""}`})]}),e.jsxs("button",{onClick:yt,className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(X,{className:"w-4 h-4"}),"Clear Filters"]})]})]}),Y&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Timeframe Type"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{onClick:()=>ft(t),className:`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${S===t?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`,children:[t==="today"&&"Today",t==="day"&&"Specific Day",t==="month"&&"Specific Month",t==="year"&&"Specific Year",t==="custom"&&"Custom Range"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[S==="day"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{type:"date",value:n.date,onChange:t=>p("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Year"}),e.jsx("input",{type:"number",value:n.year,onChange:t=>p("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Month"}),e.jsx("select",{value:n.month,onChange:t=>p("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const a=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:a,children:[qt(s)," (",a,")"]},a)})})]})]}),S==="year"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Year"}),e.jsx("input",{type:"number",value:n.year,onChange:t=>p("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"From Date"}),e.jsx("input",{type:"date",value:n.from,onChange:t=>p("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"To Date"}),e.jsx("input",{type:"date",value:n.to,onChange:t=>p("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>mt(!J),className:"text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1",children:[J?"Hide Advanced Filters":"Show Advanced Filters",e.jsx(Ye,{className:`w-4 h-4 transition-transform ${J?"rotate-180":""}`})]}),J&&e.jsxs("div",{className:"mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Contrôle du reçu"}),e.jsxs("select",{value:n.controlStatus,onChange:t=>p("controlStatus",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous"}),e.jsx("option",{value:"payment_pending",children:"Paiement en attente"}),e.jsx("option",{value:"payment_approved",children:"Paiement approuvé"}),e.jsx("option",{value:"exit_unverified",children:"Sortie non contrôlée"}),e.jsx("option",{value:"exit_verified",children:"Sortie vérifiée"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Sale Type"}),e.jsxs("select",{value:n.type,onChange:t=>p("type",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"All Types"}),e.jsx("option",{value:"sale",children:"Sale"}),e.jsx("option",{value:"expense",children:"Expense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Status"}),e.jsxs("select",{value:n.status,onChange:t=>p("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"All Status"}),e.jsx("option",{value:"completed",children:"Completed"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"expense",children:"Expense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Customer Phone"}),e.jsx("input",{type:"text",value:n.customerPhone,onChange:t=>p("customerPhone",t.target.value),placeholder:"Filter by phone...",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),M&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Applied filters:"}),e.jsxs("span",{className:"ml-2",children:["Status: ",M.status,", Type: ",M.type,M.customerPhone!=="none"&&`, Phone: ${M.customerPhone}`]})]})]}),je&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[je,e.jsx("button",{onClick:()=>D(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),_&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[_,e.jsx("button",{onClick:()=>c(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(K,{className:"w-5 h-5"}),b?"Ventes modifiées":"Transactions de vente"," (",I.length,")"]})}),Q&&!b&&e.jsxs("div",{className:"flex flex-wrap items-center gap-3 px-6 py-3 bg-purple-50 border-b border-purple-100",children:[e.jsxs("span",{className:"flex items-center gap-1 text-sm font-medium text-purple-900",children:[e.jsx(Ve,{className:"w-4 h-4"}),k.size>0?`${k.size} vente(s) sélectionnée(s)`:"Contrôle manuel (admin)"]}),e.jsx("button",{type:"button",onClick:Pe,className:"px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100",children:"Sélectionner les visibles éligibles"}),e.jsx("button",{type:"button",onClick:de,disabled:k.size===0,className:"px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",children:"Effacer la sélection"}),e.jsxs("button",{type:"button",onClick:vt,disabled:k.size===0||Te,className:"ml-auto px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",children:[Te&&e.jsx(X,{className:"w-4 h-4 animate-spin"}),"Marquer comme validés et contrôlés"]})]}),e.jsx("div",{className:"overflow-x-auto",children:se?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des ventes..."})]}):I.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(K,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:b?"Aucune vente modifiée trouvée":"Aucune vente trouvée"}),e.jsx("p",{className:"text-sm",children:"pour la période sélectionnée"})]}):e.jsx(e.Fragment,{children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[Q&&!b&&e.jsx("th",{className:"px-6 py-3 text-left",children:e.jsx("input",{type:"checkbox","aria-label":"Sélectionner les ventes éligibles visibles",className:"w-4 h-4",checked:I.some(G)&&I.filter(G).every(t=>k.has(t._id)),onChange:t=>t.target.checked?Pe():de()})}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Identifiant de vente"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Agent"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Total"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Payement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Paiement approuvé"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Contrôle sortie"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Modifié par"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:I.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[Q&&!b&&e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("input",{type:"checkbox","aria-label":`Sélectionner la vente ${t.saleId}`,className:"w-4 h-4",disabled:!G(t),checked:k.has(t._id),onChange:()=>jt(t._id)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsxs("div",{className:"text-sm text-gray-900 flex items-center gap-2",children:[t.customer.name,t.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Passage"})]}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.salesPerson||"Non spécifié"}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," Article(s)"]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:h(t.total)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",children:t.paymentMethod})}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-xs",children:[e.jsx("span",{className:`inline-flex rounded-full px-2.5 py-0.5 font-medium ${["voided","corrected","refunded"].includes(t.status)?"bg-red-100 text-red-800":L(t)?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`,children:["voided","corrected","refunded"].includes(t.status)?"INVALIDÉ":L(t)?T(t)?"VALIDÉ (HIST.)":"APPROUVÉ":"EN ATTENTE"}),t.receiptVerification?.approvedBy?.username&&e.jsxs("div",{className:"mt-1 text-gray-500",children:[t.receiptVerification.approvedBy.username,t.receiptVerification.approvedAt?` · ${j(t.receiptVerification.approvedAt)}`:""]})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-xs",children:[e.jsx("span",{className:`inline-flex rounded-full px-2.5 py-0.5 font-medium ${["voided","corrected","refunded"].includes(t.status)?"bg-red-100 text-red-800":q(t)?"bg-blue-100 text-blue-800":"bg-gray-100 text-gray-700"}`,children:["voided","corrected","refunded"].includes(t.status)?"NON AUTORISÉE":q(t)?T(t)?"CONTRÔLÉ (HIST.)":"VÉRIFIÉ":"NON EFFECTUÉ"}),t.receiptVerification?.exitVerification?.verifiedBy?.username&&e.jsxs("div",{className:"mt-1 text-gray-500",children:[t.receiptVerification.exitVerification.verifiedBy.username,t.receiptVerification.exitVerification.verifiedAt?` · ${j(t.receiptVerification.exitVerification.verifiedAt)}`:""]})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.saleEditApproval?.status==="pending"?"bg-amber-100 text-amber-800":t.status==="completed"?"bg-green-100 text-green-800":t.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.saleEditApproval?.status==="pending"?"EN ATTENTE D'APPROBATION":t.status})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:j(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm",children:(()=>{const s=(t.editHistory&&t.editHistory.length>0?t.editHistory[t.editHistory.length-1].editedBy:null)||t.editedBy;return s?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200",children:["✏️ ",s]}):e.jsx("span",{className:"text-gray-300",children:"—"})})()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[b?e.jsx("button",{onClick:()=>kt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails des modifications",children:e.jsx(ue,{className:"w-4 h-4"})}):e.jsx("button",{onClick:()=>Et(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails de",children:e.jsx(Bt,{className:"w-4 h-4"})}),!b&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Oe(t),disabled:t.status==="voided"||t.status==="corrected"||t.saleEditApproval?.status==="pending",className:`p-1 rounded ${t.status==="voided"||t.status==="corrected"||t.saleEditApproval?.status==="pending"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Edit Sale",children:e.jsx(he,{className:"w-4 h-4"})}),re(t)&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Ue(t),className:"text-green-600 hover:text-green-900 p-1 rounded",title:"Download PDF Receipt",children:e.jsx(pe,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>Me(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Print ESC/POS Receipt",children:e.jsx(Qe,{className:"w-4 h-4"})})]}),e.jsx("button",{onClick:()=>Dt(t),disabled:t.status==="voided"||t.saleEditApproval?.status==="pending",className:`p-1 rounded ${t.status==="voided"||t.saleEditApproval?.status==="pending"?"text-gray-400 cursor-not-allowed":"text-red-600 hover:text-red-900"}`,title:"Void Sale",children:e.jsx(Je,{className:"w-4 h-4"})})]})]})})]},t._id))})]})})})]}),E&&E.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",E.page," sur ",E.totalPages," · ",E.totalRecords," ventes"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!E.hasPreviousPage,onClick:()=>oe(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!E.hasNextPage,onClick:()=>oe(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),st&&i&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails de la vente"}),e.jsx("button",{onClick:()=>B(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Identifiant de vente"}),e.jsx("p",{className:"text-sm text-gray-900",children:i.saleId})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:j(i.createdAt)})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:["Methode de Payment"," "]}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:i.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${i.status==="completed"?"bg-green-100 text-green-800":i.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:i.status})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Agent"}),e.jsx("p",{className:"text-sm text-gray-900",children:i.salesPerson||"Non spécifié"})]}),i.editedBy&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Dernière modification"}),e.jsxs("p",{className:"text-sm text-gray-900",children:["By: ",i.editedBy," at"," ",i.editedAt?j(i.editedAt):"N/A"]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(_t,{className:"w-4 h-4"}),"Information sur le client",i.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Client de passage"})]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:i.customer.name})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Phone"}),e.jsx("p",{className:"text-sm text-gray-900",children:i.customer.phone})]}),i.customer.email&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:i.customer.email})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Le,{className:"w-4 h-4"}),"Articles (",i.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:i.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Nombre de pieces: ",t.quantity," ×"," ",Nt(t)]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"font-medium text-gray-900",children:[wt(t),t.enteredCurrency==="FC"&&e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["Reçu: ",h(qe(t))]})]})})]})},s))})]}),i.editHistory&&i.editHistory.length>0&&Ct(i),i.type!=="expense"&&e.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Version du reçu"}),e.jsx("strong",{children:i.receiptVerification?.version?`v${i.receiptVerification.version}`:"Historique"})]}),e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Validation paiement"}),e.jsx("strong",{className:L(i)?"text-emerald-700":"text-amber-700",children:L(i)?T(i)?"VALIDÉ (HISTORIQUE)":"APPROUVÉ":"EN ATTENTE"})]}),i.receiptVerification?.approvedBy?.username&&e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Validé par"}),e.jsxs("strong",{children:[i.receiptVerification.approvedBy.username,i.receiptVerification.approvedAt?` · ${j(i.receiptVerification.approvedAt)}`:""]})]}),e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Contrôle sortie"}),e.jsx("strong",{className:q(i)?"text-blue-700":"text-slate-600",children:q(i)?T(i)?"CONTRÔLÉ (HISTORIQUE)":"VÉRIFIÉ":"NON EFFECTUÉ"})]}),i.receiptVerification?.exitVerification?.verifiedBy?.username&&e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Sortie vérifiée par"}),e.jsxs("strong",{children:[i.receiptVerification.exitVerification.verifiedBy.username,i.receiptVerification.exitVerification.verifiedAt?` · ${j(i.receiptVerification.exitVerification.verifiedAt)}`:""]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:h(i.subtotal)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:h(i.total)})]})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[re(i)&&e.jsxs("button",{onClick:()=>Ue(i),className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(pe,{className:"w-4 h-4"}),"Télécharger PDF"]}),re(i)&&e.jsxs("button",{onClick:()=>Me(i),className:"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Qe,{className:"w-4 h-4"}),"Imprimer Reçu"]}),e.jsxs("button",{onClick:()=>Oe(i),disabled:i.status==="voided"||i.status==="corrected"||i.saleEditApproval?.status==="pending",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${i.status==="voided"||i.status==="corrected"||i.saleEditApproval?.status==="pending"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(he,{className:"w-4 h-4"}),"Modifier la vente"]}),e.jsx("button",{onClick:()=>B(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),it&&y&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails des modifications - ",y.saleId]}),e.jsx("button",{onClick:()=>ie(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg",children:"État actuel de la vente"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Client"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[y.customer.name," (",y.customer.phone,")"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total actuel"}),e.jsx("p",{className:"text-sm font-medium text-gray-900",children:h(y.total)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:y.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Articles"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[y.items.length," article(s)"]})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Historique des modifications"}),e.jsx("div",{className:"space-y-4",children:y.editHistory&&y.editHistory.length>0?y.editHistory.map((t,s)=>e.jsxs("div",{className:"border border-gray-200 rounded-lg p-4 bg-gray-50",children:[e.jsxs("div",{className:"flex justify-between items-start mb-3",children:[e.jsxs("div",{children:[e.jsxs("h5",{className:"font-medium text-gray-900",children:["Modification #",y.editHistory.length-s]}),e.jsx("p",{className:"text-sm text-gray-600",children:j(t.editedAt)})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Par: ",t.editedBy]}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Raison: ",t.reason]})]})]}),t.changes&&Object.keys(t.changes).length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h6",{className:"font-medium text-gray-700 text-sm",children:"Changements détaillés:"}),Object.entries(t.changes).map(([a,r])=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-3",children:[e.jsxs("div",{className:"font-medium text-gray-700 text-sm capitalize mb-2",children:[a.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",children:[e.jsxs("div",{className:"bg-red-50 p-3 rounded border border-red-200",children:[e.jsx("div",{className:"text-red-700 font-medium mb-1",children:"Avant:"}),e.jsx("div",{className:"text-red-600 break-words",children:typeof r.from=="object"?JSON.stringify(r.from,null,2):String(r.from||"N/A")})]}),e.jsxs("div",{className:"bg-green-50 p-3 rounded border border-green-200",children:[e.jsx("div",{className:"text-green-700 font-medium mb-1",children:"Après:"}),e.jsx("div",{className:"text-green-600 break-words",children:typeof r.to=="object"?JSON.stringify(r.to,null,2):String(r.to||"N/A")})]})]})]},a))]})]},t._id||s)):e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(ue,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun détail de modification disponible"})]})})]}),e.jsx("div",{className:"flex gap-3 pt-4 border-t border-gray-200",children:e.jsx("button",{onClick:()=>ie(!1),className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})}),at&&f&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Edit Sale - ",f.saleId]}),e.jsx("button",{onClick:me,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[_&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:_}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Information sur le client"}),e.jsxs("label",{className:"flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit",children:[e.jsx("input",{type:"checkbox",checked:d.isWalkIn,onChange:Tt,className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (sans coordonnées)"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{type:"text",value:d.customer.name,onChange:t=>u(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Numéro de téléphone"}),e.jsx("input",{type:"tel",value:d.customer.phone,onChange:t=>u(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{type:"email",value:d.customer.email,onChange:t=>u(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Methode de payement"}),e.jsxs("select",{value:d.paymentMethod,onChange:t=>u(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Cash"}),e.jsx("option",{value:"card",children:"Card"}),e.jsx("option",{value:"transfer",children:"Transfer"}),e.jsx("option",{value:"other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:ce,disabled:H,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(X,{className:`w-3 h-3 ${H?"animate-spin":""}`})," ","Refresh Products"]}),e.jsxs("button",{onClick:It,disabled:w.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(Ge,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),w.length===0&&!H&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:d.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),H?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Loading products..."}):w.length===0?e.jsx("input",{type:"text",value:t.name,onChange:a=>{const r=[...d.items];r[s].name=a.target.value,u(o=>({...o,items:r}))},placeholder:"Product name",className:"w-full p-2 border rounded"}):e.jsx("select",{value:t.productId,onChange:a=>Rt(s,a.target.value),className:"w-full p-2 border rounded",children:w.map(a=>e.jsxs("option",{value:a._id,children:[a.name," — ",h(a.price)]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>$t(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:["Nombre de pièces"," "]}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>xe(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(ge,{className:"w-3 h-3"})}),e.jsx("input",{type:"number",min:"1",value:t.quantity,onChange:a=>xe(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>xe(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(Ge,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:h(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>Pt(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(Je,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:h(Mt)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:h(Ut)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de modification"}),e.jsx("textarea",{value:d.reason,onChange:t=>u(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette vente....",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx("button",{onClick:Ft,disabled:se||d.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:se?e.jsxs(e.Fragment,{children:[e.jsx(X,{className:"w-4 h-4 animate-spin"})," Updating..."]}):e.jsxs(e.Fragment,{children:[e.jsx(he,{className:"w-4 h-4"})," Mettre à jour la vente"]})}),e.jsx("button",{onClick:me,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Cancel"})]})]})]})})]})}export{fs as default};
