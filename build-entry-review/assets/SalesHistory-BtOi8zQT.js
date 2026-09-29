import{F as qt,w as o,y as N,v as e,j as Ve,B as ze,i as Le,p as Bt,X as q,f as _t,E as Ht,b as Wt,D as ue,P as Qt,o as Jt}from"./index-BhsWK9C0.js";import{R as Yt}from"./ResponsiveTable-D3zuL6x6.js";import{E as Gt}from"./jspdf.es.min-DAVO_rHh.js";import{M as Zt,Q as Kt}from"./browser-BiM8GhGz.js";import{i as qe,e as Be,h as _e,f as He,d as Xt,j as es,g as ts,k as ss}from"./salePricing-B6Q10MKn.js";import{S as as,T as We}from"./trash-2-deBHFsnj.js";import{F as Qe,P as Je}from"./printer-CZbEjaKH.js";import{F as xe}from"./file-text-D05WJpC2.js";import{C as rs}from"./calendar-BhcXGCf1.js";import{C as Ye}from"./chevron-down-B7EvjeCJ.js";import{R as X}from"./refresh-cw-DJ_XUwey.js";import{C as is,H as pe}from"./history-CnrebkBU.js";import{T as ns}from"./triangle-alert-BbUzfBpC.js";import{S as ee}from"./square-pen-CgO74KEl.js";import{D as Ge}from"./download-Djx_cpf9.js";import{U as ls}from"./user-_wnKnTMn.js";import{P as Ze}from"./plus-DL6wMmR0.js";const te=()=>{const m=new Date,g=m.getFullYear(),k=String(m.getMonth()+1).padStart(2,"0"),I=String(m.getDate()).padStart(2,"0");return`${g}-${k}-${I}`},se=()=>{const m=new Date,g=m.getFullYear(),k=String(m.getMonth()+1).padStart(2,"0");return`${g}-${k}`},B=()=>new Date().getFullYear(),os=new Date("2026-09-03T22:00:00.000Z").getTime(),E=m=>new Date(m.createdAt).getTime()<os,_=m=>E(m)||m.receiptVerification?.paymentStatus==="approved",H=m=>E(m)||m.receiptVerification?.exitVerification?.verified===!0,Ke={cash:"Espèces",card:"Carte",transfer:"Transfert",other:"Autre"},Xe={completed:"Terminée",voided:"Annulée",corrected:"Corrigée",refunded:"Remboursée",pending:"En attente",expense:"Dépense"};function As(){const{token:m}=qt(),g=o.useCallback(()=>m||localStorage.getItem("token")||"",[m]),k=o.useRef(()=>{}),I=o.useRef(()=>{}),[et,tt]=o.useState([]),[w,st]=o.useState([]),[F,at]=o.useState({shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",receiptFooter:"Merci pour votre confiance ! À bientôt."}),[ae,$]=o.useState(!0),[u,he]=o.useState(""),[n,rt]=o.useState(null),[it,R]=o.useState(!1),[nt,ge]=o.useState(!1),[f,fe]=o.useState(null),[d,x]=o.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),[be,D]=o.useState(null),[W,c]=o.useState(null),[Q,ye]=o.useState(!1),[lt,je]=o.useState(null),[J,re]=o.useState(!1),ie=t=>!!lt&&t.saleEditApproval?.status!=="pending",[S,ve]=o.useState("today"),[i,ne]=o.useState({from:"",to:"",date:te(),year:B().toString(),month:se().split("-")[1],type:"",status:"",customerPhone:"",controlStatus:""}),[p,Ne]=o.useState(!1),[we,ot]=o.useState([]),[b,dt]=o.useState(null),[ct,Y]=o.useState(!1),[Se,mt]=o.useState(null),[A,ut]=o.useState(null),[M,xt]=o.useState(null),[U,pt]=o.useState(!1),[O,ht]=o.useState(!1),[Ce,le]=o.useState(1),[T,gt]=o.useState(null),[V,ft]=o.useState(null),[ke,Ae]=o.useState(!1),[C,oe]=o.useState(new Set),[Te,Ee]=o.useState(!1);o.useEffect(()=>{bt(),z(),ce(),fetch(`${N}/settings/receipt`,{headers:{Authorization:`Bearer ${g()}`}}).then(s=>s.ok?s.json():null).then(s=>{s&&at({shopName:s.shopName||"ETS. DIEU MERCI",shopAddress:s.shopAddress||"",shopNumber:s.shopNumber||"",shopRegistration:s.shopRegistration||"",receiptFooter:s.receiptFooter||""})}).catch(()=>{});const t=()=>{k.current(),I.current()};return window.addEventListener("salesUpdated",t),()=>{window.removeEventListener("salesUpdated",t)}},[]),o.useEffect(()=>{Object.keys(i).length>0&&z()},[i,Ce,u]),o.useEffect(()=>{Re()},[i,u]),o.useEffect(()=>{le(1)},[i,u]);const bt=async()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);je(a),re(a.role==="admin");return}const s=await fetch(`${N}/users/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(s.ok){const a=await s.json();je(a),re(a.role==="admin"),localStorage.setItem("user",JSON.stringify(a))}}catch(t){console.error("Error fetching user data:",t),re(!1)}},yt=t=>t.filter(s=>{const r=!["expense","depense"].includes(s.status?.toLowerCase()),l=s.saleId&&s.customer&&s.items;return r&&l}),jt=()=>{const t=new URLSearchParams;switch(t.set("page",String(Ce)),t.set("limit","50"),t.set("type","sale"),S){case"custom":i.from&&t.append("from",i.from),i.to&&t.append("to",i.to);break;case"day":i.date&&t.append("date",i.date);break;case"month":i.year&&t.append("year",i.year),i.month&&t.append("month",i.month);break;case"year":i.year&&t.append("year",i.year);break}return i.status&&t.append("status",i.status),i.customerPhone&&t.append("customerPhone",i.customerPhone),i.controlStatus&&t.append("controlStatus",i.controlStatus),u.trim()&&t.append("search",u.trim()),t.toString()},z=async()=>{try{$(!0),c(null);const t=jt(),s=`${N}/sales${t?`?${t}`:""}`;console.log("Fetching sales from:",s);const a=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(a.ok){const r=await a.json();if(r.success&&r.data&&Array.isArray(r.data)){const l=r.data;console.log(`Fetched ${l.length} sales from API`),console.log("Timeframe metadata:",r.timeframe),console.log("Summary stats:",r.summary);const v=yt(l);console.log(`After filtering: ${v.length} valid sales`),tt(v),gt(r.pagination||null),mt(r.timeframe),ut(r.summary),xt(r.filtersApplied),vt(v)}else console.warn("Unexpected sales data structure:",r),c("Unexpected response format from server")}else{console.error("Sales fetch failed:",a.status);const r=await a.text();c(`Failed to load sales: ${a.status} ${r}`)}}catch(t){console.error("Error loading sales:",t),c("Failed to load sales. Please check your connection.")}finally{$(!1)}};k.current=z;const vt=t=>{const a=t.filter(r=>r.editHistory&&r.editHistory.length>0||r.editedBy).sort((r,l)=>{const v=r.editedAt?new Date(r.editedAt).getTime():new Date(r.updatedAt).getTime();return(l.editedAt?new Date(l.editedAt).getTime():new Date(l.updatedAt).getTime())-v});ot(a)},Nt=t=>{ve(t);const s={...i};switch(t){case"today":s.date=te(),s.from="",s.to="",s.year=B().toString(),s.month=se().split("-")[1];break;case"day":s.date=te(),s.from="",s.to="";break;case"month":s.year=B().toString(),s.month=se().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=B().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),1);s.from=r.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}ne(s)},y=(t,s)=>{ne(a=>({...a,[t]:s}))},wt=()=>{ne({from:"",to:"",date:te(),year:B().toString(),month:se().split("-")[1],type:"",status:"",customerPhone:"",controlStatus:""}),ve("today"),Ne(!1),he("")},G=t=>(t.type??"sale")==="sale"&&!["voided","corrected","refunded"].includes(t.status)&&!E(t)&&(!_(t)||!H(t)),St=t=>{oe(s=>{const a=new Set(s);return a.has(t)?a.delete(t):a.add(t),a})},$e=()=>{oe(t=>{const s=new Set(t);return P.filter(G).forEach(a=>s.add(a._id)),s})},de=()=>oe(new Set),Ct=async()=>{if(C.size!==0){Ee(!0),c(null),D(null);try{const t=await fetch(`${N}/sales/receipt-control/admin-mark-complete`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify({saleIds:Array.from(C),reason:"Admin bulk override (SalesHistory)"})}),s=await t.json();if(!t.ok){c(s.error||"Échec de la mise à jour manuelle des reçus");return}D(`Reçus mis à jour : ${s.updated} · Déjà complets : ${s.alreadyComplete} · Rejetés : ${s.rejected}`),de(),k.current(),I.current()}catch(t){console.error("Admin override error:",t),c("Connexion au serveur impossible")}finally{Ee(!1)}}},ce=async()=>{try{ye(!0);const t=await fetch(`${N}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),console.log("Processed products:",a.length),st(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{ye(!1)}},P=p?we.filter(t=>t.saleId.toLowerCase().includes(u.toLowerCase())||t.customer.name.toLowerCase().includes(u.toLowerCase())||t.customer.phone.includes(u)||t.salesPerson&&t.salesPerson.toLowerCase().includes(u.toLowerCase())):et.filter(t=>t.saleId.toLowerCase().includes(u.toLowerCase())||t.customer.name.toLowerCase().includes(u.toLowerCase())||t.customer.phone.includes(u)||t.salesPerson&&t.salesPerson.toLowerCase().includes(u.toLowerCase())),j=t=>Jt(t),h=t=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(t),L=t=>`${new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(t)} FC`,Pe=(t,s)=>{const a=Xt(t,s);return`${es(t).toFixed(2)}$${a===void 0?"":` / ${L(a)}`}`},Ie=(t,s)=>{const a=ts(t,s);return`${qe(t).toFixed(2)}$${a===void 0?"":` / ${L(a)}`}`},Z=(t,s,a)=>{const r=ss(t,s,a);return`${t.toFixed(2)}$${r===void 0?"":` / ${L(r)}`}`},kt=t=>Be(t)==="FC"?L(_e(t)):h(_e(t)),At=t=>Be(t)==="FC"?L(He(t)):h(He(t)),Tt=()=>{if(Se)return Se.description;switch(S){case"today":return"Today";case"day":return i.date?`Day: ${i.date}`:"Today";case"month":return i.year&&i.month?`Month: ${i.year}-${i.month.padStart(2,"0")}`:"This month";case"year":return i.year?`Year: ${i.year}`:"This year";case"custom":return i.from&&i.to?`Range: ${i.from} to ${i.to}`:i.from?`From: ${i.from}`:i.to?`Until: ${i.to}`:"Custom range";default:return"Today"}},Et=t=>{dt(t),Y(!0)},$t=t=>{if(!t.editHistory||t.editHistory.length===0)return null;const s=t.editHistory[t.editHistory.length-1],a=s.changes;return e.jsxs("div",{className:"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:[e.jsxs("h4",{className:"font-medium text-yellow-800 mb-2 flex items-center gap-2",children:[e.jsx(pe,{className:"w-4 h-4"}),"Dernière modification"]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Modifié par:"}),e.jsx("span",{className:"font-medium",children:s.editedBy||t.editedBy||"Unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Date de modification:"}),e.jsx("span",{className:"font-medium",children:j(s.editedAt||t.editedAt||t.updatedAt)})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Raison:"}),e.jsx("span",{className:"font-medium text-right",children:s.reason})]}),a&&Object.keys(a).length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-yellow-200",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"Changements:"}),Object.entries(a).map(([r,l])=>e.jsxs("div",{className:"mb-2 last:mb-0",children:[e.jsxs("div",{className:"font-medium text-yellow-700 capitalize",children:[r.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{className:"bg-red-50 p-2 rounded",children:[e.jsx("div",{className:"text-red-600 font-medium",children:"Avant:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(l.from)})]}),e.jsxs("div",{className:"bg-green-50 p-2 rounded",children:[e.jsx("div",{className:"text-green-600 font-medium",children:"Après:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(l.to)})]})]})]},r))]})]})]})},Fe=async t=>{let s=t.receiptToken;if(!s){const r=await fetch(`${N}/sales/${t._id}/receipt-token`,{headers:{Authorization:`Bearer ${g()}`}}),l=await r.json().catch(()=>({}));if(!r.ok||!l.receiptToken)throw new Error(l.message||"QR du reçu indisponible");s=l.receiptToken}if(!s)throw new Error("QR du reçu indisponible");const a=await Kt.toDataURL(s,{errorCorrectionLevel:"M",margin:4,width:320,color:{dark:"#000000",light:"#ffffff"}});return{receiptToken:s,qrDataUrl:a}},Pt=()=>{const t=new URLSearchParams;switch(S){case"custom":i.from&&t.set("from",i.from),i.to&&t.set("to",i.to);break;case"day":i.date&&t.set("date",i.date);break;case"month":i.year&&t.set("year",i.year),i.month&&t.set("month",i.month);break;case"year":i.year&&t.set("year",i.year);break}return i.customerPhone&&t.set("customerPhone",i.customerPhone),u.trim()&&t.set("search",u.trim()),t.toString()},Re=async()=>{try{Ae(!1);const t=Pt(),s=await fetch(`${N}/sales/scan-stats${t?`?${t}`:""}`,{headers:{Authorization:`Bearer ${g()}`}});if(!s.ok)throw new Error(`Scan statistics request failed (${s.status})`);ft(await s.json())}catch(t){console.error("Error loading receipt-control statistics:",t),Ae(!0)}};I.current=Re;const De=async t=>{let s;try{({qrDataUrl:s}=await Fe(t))}catch(r){c(r instanceof Error?r.message:"QR du reçu indisponible");return}const a=window.open("","_blank","width=320,height=600");a&&(a.document.write(`
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
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${Pe(r,t.exchangeRate)} = ${Ie(r,t.exchangeRate)}</strong></div>
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
`),a.document.close())},Me=async t=>{let s;try{({qrDataUrl:s}=await Fe(t))}catch(l){c(l instanceof Error?l.message:"QR du reçu indisponible");return}const a=new Gt;a.setFontSize(20),a.text("ETS. DIEU MERCI",105,10,{align:"center"}),a.setFontSize(10),a.text("<<Chez Dan Collection>>",105,15,{align:"center"}),a.setFontSize(12),a.text("RCCM: 14-A-017885",105,20,{align:"center"}),a.text("Tél: +243 977 771 421 / +243 853 549 102",105,25,{align:"center"}),a.text("Av Manono Coin Munama N°39,C.Kenya, Lubumbashi",105,30,{align:"center"}),a.setFontSize(16),a.text("Reçu de vente",105,35,{align:"center"}),a.setFontSize(10),a.text(`Date: ${j(t.createdAt)}`,20,45),a.text(`Reçu #: ${t.saleId}`,20,52),a.text(`Payement: ${t.paymentMethod.toUpperCase()}`,20,59),a.text(`Statut: ${t.status.toUpperCase()}`,20,66),a.text(`Agent: ${t.salesPerson||"Non spécifié"}`,20,73),a.setFontSize(12),a.text("Information sur le client:",20,85),a.setFontSize(10),a.text(`Nom: ${t.customer.name}`,20,92),t.customer.phone&&a.text(`Phone: ${t.customer.phone}`,20,99),t.customer.email&&a.text(`Email: ${t.customer.email}`,20,106),a.setFontSize(12),a.text("Articles:",20,113),a.setFontSize(10);let r=120;t.items.forEach((l,v)=>{r>250&&(a.addPage(),r=20),a.text(`${v+1}. ${l.name}`,20,r),a.text(`Qté: ${l.quantity} x ${Pe(l,t.exchangeRate)} = ${Ie(l,t.exchangeRate)}`,25,r+6),r+=15}),r+=7,a.text(`Sous-total: ${Z(t.subtotal,t.items,t.exchangeRate)}`,20,r),a.text(`Total: ${Z(t.total,t.items,t.exchangeRate)}`,20,r+5),a.addImage(s,"PNG",84,r+10,42,42),a.setFontSize(8),a.setFont("helvetica","bold"),a.text("UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?",105,r+56,{align:"center"}),a.setFont("helvetica","normal"),a.text("Gestion, ventes, stock & bien plus",105,r+60,{align:"center"}),a.setFont("helvetica","bold"),a.text("WhatsApp : +243 844 311 550",105,r+64,{align:"center"}),r+=53,a.setFontSize(10),a.text("Merci pour votre achat !",105,r+20,{align:"center"}),a.text("Les marchandises vendues ne sont ni reprises ni échangées.",105,r+30,{align:"center"}),a.text("À bientôt",105,r+40,{align:"center"}),a.save(`receipt-${t.saleId}.pdf`)},It=t=>{rt(t),R(!0),c(null)},Ue=async t=>{if(t.status==="voided"||t.status==="corrected"){c("Cannot edit a voided or corrected sale");return}fe(t),x({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",isWalkIn:!!t.isWalkIn}),ge(!0),c(null),w.length===0&&await ce()},K=()=>{ge(!1),fe(null),x({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),c(null)},Ft=()=>{x(t=>({...t,isWalkIn:!t.isWalkIn,customer:t.isWalkIn?t.customer:{name:t.customer.name,phone:"",email:""}}))},me=(t,s)=>{if(s<1)return;const a=[...d.items];a[t].quantity=s,a[t].total=s*a[t].price,x(r=>({...r,items:a})),c(null)},Rt=(t,s)=>{if(s<0)return;const a=[...d.items],r=a[t].exchangeRate??f?.exchangeRate;a[t]={...a[t],price:s,total:s*a[t].quantity,enteredPrice:s,enteredCurrency:"USD",priceUSD:s,priceFC:r?Math.round(s*r):void 0,exchangeRate:r},x(l=>({...l,items:a}))},Dt=t=>{const s=d.items.filter((a,r)=>r!==t);x(a=>({...a,items:s}))},Mt=()=>{if(w.length===0){c("No products available. Please refresh products first.");return}const t=w[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price,priceFC:f?.exchangeRate?Math.round(t.price*f.exchangeRate):void 0,exchangeRate:f?.exchangeRate,_id:`temp-${Date.now()}`};x(a=>({...a,items:[...a.items,s]}))},Ut=(t,s)=>{const a=w.find(v=>v._id===s);if(!a){c("Selected product not found");return}const r=[...d.items],l=r[t].exchangeRate??f?.exchangeRate;r[t]={...r[t],productId:s,name:a.name,price:a.price,total:a.price*r[t].quantity,enteredPrice:a.price,enteredCurrency:"USD",priceUSD:a.price,priceFC:l?Math.round(a.price*l):void 0,exchangeRate:l},x(v=>({...v,items:r})),c(null)},Oe=()=>{const t=d.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},Ot=async()=>{if(f){if(d.items.length===0){c("Sale must contain at least one item");return}if(!d.isWalkIn&&(!d.customer.name||!d.customer.phone)){c("Customer name and phone are required");return}if(!d.reason){c("Please provide a reason for editing this sale");return}try{$(!0);const{subtotal:t,total:s}=Oe(),a={customer:d.isWalkIn?{name:d.customer.name.trim()||"Client de passage",phone:"",email:""}:d.customer,isWalkIn:d.isWalkIn,items:d.items.map(l=>({productId:l.productId,name:l.name,quantity:l.quantity,price:l.price,total:l.total,enteredPrice:l.enteredPrice,enteredCurrency:l.enteredCurrency,priceUSD:l.priceUSD,priceFC:l.priceFC,exchangeRate:l.exchangeRate})),subtotal:t,total:s,exchangeRate:f.exchangeRate,paymentMethod:d.paymentMethod,reason:d.reason,_id:f._id,saleId:f.saleId},r=await fetch(`${N}/sales/${f._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify(a)});if(r.ok){const l=await r.json();D(r.status===202?"Modification enregistrée — EN ATTENTE D'APPROBATION":l.message||"Vente mise à jour avec succès"),await z(),setTimeout(()=>{window.dispatchEvent(new Event("salesUpdated"))},1e3),K()}else{const l=await r.json();c(l.error||l.message||`Failed to update sale: ${r.status} ${r.statusText}`)}}catch(t){console.error("Error updating sale:",t),c("Failed to update sale. Please check your connection.")}finally{$(!1)}}},Vt=async t=>{if(t.status==="voided"){c("Sale is already voided");return}if(window.confirm(`Are you sure you want to void sale ${t.saleId}? This action cannot be undone.`))try{$(!0);const s=await fetch(`${N}/sales/${t._id}/void`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${g()}`},body:JSON.stringify({reason:"Sale voided by admin"})});if(s.ok)D("Vente annulée avec succès."),await z(),R(!1);else{const a=await s.json();c(a.error||"Failed to void sale")}}catch(s){c("Failed to void sale"),console.error("Error voiding sale:",s)}finally{$(!1)}},{subtotal:zt,total:Lt}=Oe();return e.jsxs("div",{className:"page space-y-5",children:[e.jsxs("header",{className:"page-header",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"page-title",children:"Historique des ventes"}),e.jsx("p",{className:"page-subtitle",children:"Retrouvez une vente, son reçu et son état de contrôle."})]}),e.jsxs("div",{className:"page-actions w-full sm:w-auto",children:[e.jsxs("div",{className:"input-group flex-1 sm:flex-none sm:w-72",children:[e.jsx(as,{"aria-hidden":"true"}),e.jsx("input",{"aria-label":"Rechercher une vente",type:"search",placeholder:"Identifiant, client, agent…",className:"input",value:u,onChange:t=>he(t.target.value)})]}),e.jsxs("button",{type:"button",onClick:()=>Ne(!p),"aria-pressed":p,className:`btn ${p?"btn-primary":"btn-secondary"}`,children:[e.jsx(Qe,{"aria-hidden":"true"}),p?"Toutes les ventes":"Ventes modifiées",p&&e.jsx("span",{className:"badge num",style:{background:"rgb(255 255 255 / 0.2)",color:"inherit",borderColor:"transparent"},children:we.length})]})]})]}),J&&A&&e.jsxs("section",{"aria-labelledby":"sales-summary-title",className:"grid gap-3",children:[e.jsx("div",{className:"flex items-center justify-between gap-3",children:e.jsxs("h2",{id:"sales-summary-title",className:"eyebrow",children:[e.jsx(Ve,{"aria-hidden":"true"}),"Synthèse de la période · vue administrateur"]})}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3",children:[e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Chiffre d'affaires"}),e.jsx("span",{className:"metric-value text-green-700",children:h(A.revenue)})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Net"}),e.jsx("span",{className:"metric-value text-blue-700",children:h(A.net)})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Dépenses"}),e.jsx("span",{className:"metric-value text-red-700",children:h(A.expenses)})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Enregistrements"}),e.jsx("span",{className:"metric-value",children:A.totalRecords})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Ventes"}),e.jsx("span",{className:"metric-value",children:A.salesCount})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("span",{className:"metric-label",children:"Dépenses (nombre)"}),e.jsx("span",{className:"metric-value",children:A.expensesCount})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",role:"group","aria-label":"Filtrer par contrôle du reçu",children:[[{value:"",label:"Toutes",count:V?.total,icon:xe,tone:"text-gray-500",title:void 0},{value:"payment_pending",label:"Paiement non validé",count:V?.paymentPending,icon:ze,tone:"text-amber-600",title:"Ventes dont le paiement n'a pas encore été scanné/validé"},{value:"exit_unverified",label:"Sortie non contrôlée",count:V?.awaitingExitControl,icon:Le,tone:"text-orange-600",title:"Paiement approuvé mais sortie pas encore contrôlée"},{value:"payment_approved",label:"Paiement validé",count:V?.paymentApproved,icon:ze,tone:"text-green-600",title:void 0},{value:"exit_verified",label:"Sortie contrôlée",count:V?.exitControlled,icon:Le,tone:"text-blue-600",title:void 0}].map((t,s)=>{const a=t.icon,r=i.controlStatus===t.value;return e.jsxs("button",{type:"button",onClick:()=>y("controlStatus",t.value),title:t.title,"aria-pressed":r,className:`metric-card text-left transition-colors ${s===0?"col-span-2 sm:col-span-1":""} ${r?"!border-blue-600 ring-2 ring-blue-600/20 !bg-blue-50":"hover:!bg-gray-50"}`,children:[e.jsxs("span",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"metric-label",children:t.label}),e.jsx(a,{className:`w-4 h-4 shrink-0 ${t.tone}`,"aria-hidden":"true"})]}),e.jsx("span",{className:"metric-value",children:ke?"—":t.count??"…"})]},t.value||"all")}),ke&&e.jsx("p",{className:"text-sm text-amber-700 col-span-2 sm:col-span-3 lg:col-span-5",children:"Statistiques de contrôle temporairement indisponibles."})]}),e.jsxs("section",{className:"card","aria-labelledby":"sales-period-title",children:[e.jsxs("div",{className:"card-header",children:[e.jsxs("h2",{id:"sales-period-title",className:"section-title flex items-center gap-2 min-w-0",children:[e.jsx(rs,{className:"w-4 h-4 text-gray-500 shrink-0","aria-hidden":"true"}),e.jsxs("span",{className:"truncate",children:[p?"Ventes modifiées":"Toutes les ventes"," · ",Tt()]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{type:"button",onClick:()=>pt(!U),"aria-expanded":U,className:"btn btn-secondary btn-sm",children:[e.jsx(Qe,{"aria-hidden":"true"}),U?"Masquer les filtres":"Filtres",e.jsx(Ye,{className:`transition-transform ${U?"rotate-180":""}`,"aria-hidden":"true"})]}),e.jsxs("button",{type:"button",onClick:wt,className:"btn btn-ghost btn-sm",children:[e.jsx(X,{"aria-hidden":"true"}),"Réinitialiser"]})]})]}),e.jsxs("div",{className:"card-body empty:hidden",children:[U&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"field-label block mb-2",id:"sales-timeframe-label",children:"Période"}),e.jsx("div",{className:"segmented max-w-full overflow-x-auto",role:"group","aria-labelledby":"sales-timeframe-label",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{type:"button","aria-pressed":S===t,onClick:()=>Nt(t),children:[t==="today"&&"Aujourd'hui",t==="day"&&"Jour",t==="month"&&"Mois",t==="year"&&"Année",t==="custom"&&"Plage"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[S==="day"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-66084",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{id:"saleshistory-field-66084",type:"date",value:i.date,onChange:t=>y("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-66657",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("input",{id:"saleshistory-field-66657",type:"number",value:i.year,onChange:t=>y("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-67226",className:"block text-sm font-medium text-gray-700 mb-1",children:"Mois"}),e.jsx("select",{id:"saleshistory-field-67226",value:i.month,onChange:t=>y("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const a=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:a,children:[Bt(s)," (",a,")"]},a)})})]})]}),S==="year"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-68202",className:"block text-sm font-medium text-gray-700 mb-1",children:"Year"}),e.jsx("input",{id:"saleshistory-field-68202",type:"number",value:i.year,onChange:t=>y("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-68847",className:"block text-sm font-medium text-gray-700 mb-1",children:"Du"}),e.jsx("input",{id:"saleshistory-field-68847",type:"date",value:i.from,onChange:t=>y("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-69348",className:"block text-sm font-medium text-gray-700 mb-1",children:"Au"}),e.jsx("input",{id:"saleshistory-field-69348",type:"date",value:i.to,onChange:t=>y("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>ht(!O),"aria-expanded":O,className:"btn btn-ghost btn-sm -ml-3 text-blue-700",children:[O?"Masquer les filtres avancés":"Filtres avancés",e.jsx(Ye,{className:`w-4 h-4 transition-transform ${O?"rotate-180":""}`})]}),O&&e.jsxs("div",{className:"mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-70567",className:"block text-sm font-medium text-gray-700 mb-1",children:"Contrôle du reçu"}),e.jsxs("select",{id:"saleshistory-field-70567",value:i.controlStatus,onChange:t=>y("controlStatus",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous"}),e.jsx("option",{value:"payment_pending",children:"Paiement en attente"}),e.jsx("option",{value:"payment_approved",children:"Paiement approuvé"}),e.jsx("option",{value:"exit_unverified",children:"Sortie non contrôlée"}),e.jsx("option",{value:"exit_verified",children:"Sortie vérifiée"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-71470",className:"block text-sm font-medium text-gray-700 mb-1",children:"Type"}),e.jsxs("select",{id:"saleshistory-field-71470",value:i.type,onChange:t=>y("type",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les types"}),e.jsx("option",{value:"sale",children:"Vente"}),e.jsx("option",{value:"expense",children:"Dépense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-72167",className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsxs("select",{id:"saleshistory-field-72167",value:i.status,onChange:t=>y("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les statuts"}),e.jsx("option",{value:"completed",children:"Terminée"}),e.jsx("option",{value:"pending",children:"En attente"}),e.jsx("option",{value:"expense",children:"Dépense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-72951",className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone du client"}),e.jsx("input",{id:"saleshistory-field-72951",type:"text",value:i.customerPhone,onChange:t=>y("customerPhone",t.target.value),placeholder:"+243 …",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),M&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Filtres appliqués :"}),e.jsxs("span",{className:"ml-2",children:["Statut : ",M.status,", Type : ",M.type,M.customerPhone!=="none"&&`, Téléphone : ${M.customerPhone}`]})]})]})]}),be&&e.jsxs("div",{className:"alert alert-success",role:"status",children:[e.jsx(is,{className:"w-5 h-5","aria-hidden":"true"}),e.jsx("span",{className:"flex-1",children:be}),e.jsx("button",{type:"button","aria-label":"Fermer le message",onClick:()=>D(null),className:"btn btn-ghost btn-icon btn-sm -my-1 -mr-1",children:e.jsx(q,{"aria-hidden":"true"})})]}),W&&e.jsxs("div",{className:"alert alert-danger",role:"alert",children:[e.jsx(ns,{className:"w-5 h-5","aria-hidden":"true"}),e.jsx("span",{className:"flex-1",children:W}),e.jsx("button",{type:"button","aria-label":"Fermer le message",onClick:()=>c(null),className:"btn btn-ghost btn-icon btn-sm -my-1 -mr-1",children:e.jsx(q,{"aria-hidden":"true"})})]}),e.jsxs("section",{className:"card","aria-labelledby":"sales-list-title",children:[e.jsx("div",{className:"card-header",children:e.jsxs("h2",{id:"sales-list-title",className:"section-title flex items-center gap-2",children:[e.jsx(xe,{className:"w-4 h-4 text-gray-500","aria-hidden":"true"}),p?"Ventes modifiées":"Transactions de vente",e.jsx("span",{className:"badge num",children:P.length})]})}),J&&!p&&e.jsxs("div",{className:"flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200",children:[e.jsxs("span",{className:"flex items-center gap-1.5 text-sm font-medium text-gray-800 mr-auto",children:[e.jsx(Ve,{className:"w-4 h-4 text-gray-500","aria-hidden":"true"}),C.size>0?`${C.size} vente(s) sélectionnée(s)`:"Contrôle manuel (admin)"]}),e.jsx("button",{type:"button",onClick:$e,className:"btn btn-secondary btn-sm",children:"Sélectionner les visibles éligibles"}),e.jsx("button",{type:"button",onClick:de,disabled:C.size===0,className:"btn btn-ghost btn-sm",children:"Effacer la sélection"}),e.jsxs("button",{type:"button",onClick:Ct,disabled:C.size===0||Te,className:"btn btn-primary btn-sm",children:[Te&&e.jsx(X,{className:"w-4 h-4 animate-spin"}),"Marquer comme validés et contrôlés"]})]}),e.jsx("div",{className:"sales-table-region",children:ae?e.jsx(_t,{label:"Chargement des ventes…"}):P.length===0?e.jsx(Ht,{title:p?"Aucune vente modifiée":"Aucune vente trouvée",icon:e.jsx(xe,{"aria-hidden":"true"}),children:"Aucun résultat pour la période et les filtres sélectionnés."}):e.jsx(e.Fragment,{children:e.jsxs(Yt,{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[J&&!p&&e.jsx("th",{className:"px-6 py-3 text-left",children:e.jsx("input",{type:"checkbox","aria-label":"Sélectionner les ventes éligibles visibles",className:"w-4 h-4",checked:P.some(G)&&P.filter(G).every(t=>C.has(t._id)),onChange:t=>t.target.checked?$e():de()})}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Identifiant de vente"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Agent"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Total"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Payement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Paiement approuvé"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Contrôle sortie"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Modifié par"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:P.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[J&&!p&&e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("input",{type:"checkbox","aria-label":`Sélectionner la vente ${t.saleId}`,className:"w-4 h-4",disabled:!G(t),checked:C.has(t._id),onChange:()=>St(t._id)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsxs("div",{className:"text-sm text-gray-900 flex items-center gap-2",children:[t.customer.name,t.isWalkIn&&e.jsx("span",{className:"badge badge-warning",children:"Passage"})]}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.salesPerson||"Non spécifié"}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," article",t.items.length>1?"s":""]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:h(t.total)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"badge",children:Ke[t.paymentMethod]||t.paymentMethod})}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-xs",children:[e.jsx("span",{className:`inline-flex rounded-full px-2.5 py-0.5 font-medium ${["voided","corrected","refunded"].includes(t.status)?"bg-red-100 text-red-800":_(t)?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`,children:["voided","corrected","refunded"].includes(t.status)?"INVALIDÉ":_(t)?E(t)?"VALIDÉ (HIST.)":"APPROUVÉ":"EN ATTENTE"}),t.receiptVerification?.approvedBy?.username&&e.jsxs("div",{className:"mt-1 text-gray-500",children:[t.receiptVerification.approvedBy.username,t.receiptVerification.approvedAt?` · ${j(t.receiptVerification.approvedAt)}`:""]})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-xs",children:[e.jsx("span",{className:`inline-flex rounded-full px-2.5 py-0.5 font-medium ${["voided","corrected","refunded"].includes(t.status)?"bg-red-100 text-red-800":H(t)?"bg-blue-100 text-blue-800":"bg-gray-100 text-gray-700"}`,children:["voided","corrected","refunded"].includes(t.status)?"NON AUTORISÉE":H(t)?E(t)?"CONTRÔLÉ (HIST.)":"VÉRIFIÉ":"NON EFFECTUÉ"}),t.receiptVerification?.exitVerification?.verifiedBy?.username&&e.jsxs("div",{className:"mt-1 text-gray-500",children:[t.receiptVerification.exitVerification.verifiedBy.username,t.receiptVerification.exitVerification.verifiedAt?` · ${j(t.receiptVerification.exitVerification.verifiedAt)}`:""]})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.saleEditApproval?.status==="pending"?"bg-amber-100 text-amber-800":t.status==="completed"?"bg-green-100 text-green-800":t.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.saleEditApproval?.status==="pending"?"En attente d'approbation":Xe[t.status]||t.status})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:j(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm",children:(()=>{const s=(t.editHistory&&t.editHistory.length>0?t.editHistory[t.editHistory.length-1].editedBy:null)||t.editedBy;return s?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200",children:[e.jsx(ee,{className:"w-3 h-3","aria-hidden":"true"}),s]}):e.jsx("span",{className:"text-gray-300",children:"—"})})()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[p?e.jsxs("button",{"aria-label":"Voir les détails des modifications",onClick:()=>Et(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails des modifications",children:[e.jsx(pe,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"Modifications"})]}):e.jsxs("button",{"aria-label":"Voir les détails de la vente",onClick:()=>It(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails de la vente",children:[e.jsx(Wt,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"Détails"})]}),!p&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{"aria-label":"Modifier la vente",onClick:()=>Ue(t),disabled:t.status==="voided"||t.status==="corrected"||t.saleEditApproval?.status==="pending",className:`p-1 rounded ${t.status==="voided"||t.status==="corrected"||t.saleEditApproval?.status==="pending"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Modifier la vente",children:[e.jsx(ee,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"Modifier"})]}),ie(t)&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{"aria-label":"Télécharger le reçu PDF",onClick:()=>Me(t),className:"text-green-600 hover:text-green-900 p-1 rounded",title:"Télécharger le reçu PDF",children:[e.jsx(Ge,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"PDF"})]}),e.jsxs("button",{"aria-label":"Imprimer le reçu",onClick:()=>De(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Imprimer le reçu (ESC/POS)",children:[e.jsx(Je,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"Imprimer"})]})]}),e.jsxs("button",{"aria-label":"Annuler la vente",onClick:()=>Vt(t),disabled:t.status==="voided"||t.saleEditApproval?.status==="pending",className:`p-1 rounded ${t.status==="voided"||t.saleEditApproval?.status==="pending"?"text-gray-400 cursor-not-allowed":"text-red-600 hover:text-red-900"}`,title:"Annuler la vente",children:[e.jsx(We,{className:"w-4 h-4","aria-hidden":"true"}),e.jsx("span",{className:"ui-action-label",children:"Annuler"})]})]})]})})]},t._id))})]})})})]}),T&&T.totalPages>1&&e.jsxs("nav",{className:"card flex flex-wrap items-center justify-between gap-3 px-4 py-3","aria-label":"Pagination des ventes",children:[e.jsxs("span",{className:"text-sm text-gray-600 num",children:["Page ",T.page," sur ",T.totalPages," · ",T.totalRecords," ventes"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!T.hasPreviousPage,onClick:()=>le(t=>Math.max(1,t-1)),className:"btn btn-secondary btn-sm",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!T.hasNextPage,onClick:()=>le(t=>t+1),className:"btn btn-secondary btn-sm",children:"Suivant"})]})]}),it&&n&&e.jsx(ue,{label:"Détails de la vente",onClose:()=>R(!1),children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails de la vente"}),e.jsx("button",{type:"button","aria-label":"Fermer",onClick:()=>R(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx(q,{className:"w-5 h-5","aria-hidden":"true"})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Identifiant de vente"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.saleId})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:j(n.createdAt)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:Ke[n.paymentMethod]||n.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${n.status==="completed"?"bg-green-100 text-green-800":n.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:Xe[n.status]||n.status})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Agent"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.salesPerson||"Non spécifié"})]}),n.editedBy&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Dernière modification"}),e.jsxs("p",{className:"text-sm text-gray-900",children:["Par ",n.editedBy," le"," ",n.editedAt?j(n.editedAt):"N/A"]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(ls,{className:"w-4 h-4"}),"Information sur le client",n.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Client de passage"})]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.name})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.phone})]}),n.customer.email&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.email})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Qt,{className:"w-4 h-4"}),"Articles (",n.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:n.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Pièces : ",t.quantity," ×"," ",kt(t)]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"font-medium text-gray-900",children:[At(t),t.enteredCurrency==="FC"&&e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["Reçu: ",h(qe(t))]})]})})]})},s))})]}),n.editHistory&&n.editHistory.length>0&&$t(n),n.type!=="expense"&&e.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Version du reçu"}),e.jsx("strong",{children:n.receiptVerification?.version?`v${n.receiptVerification.version}`:"Historique"})]}),e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Validation paiement"}),e.jsx("strong",{className:_(n)?"text-emerald-700":"text-amber-700",children:_(n)?E(n)?"VALIDÉ (HISTORIQUE)":"APPROUVÉ":"EN ATTENTE"})]}),n.receiptVerification?.approvedBy?.username&&e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Validé par"}),e.jsxs("strong",{children:[n.receiptVerification.approvedBy.username,n.receiptVerification.approvedAt?` · ${j(n.receiptVerification.approvedAt)}`:""]})]}),e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Contrôle sortie"}),e.jsx("strong",{className:H(n)?"text-blue-700":"text-slate-600",children:H(n)?E(n)?"CONTRÔLÉ (HISTORIQUE)":"VÉRIFIÉ":"NON EFFECTUÉ"})]}),n.receiptVerification?.exitVerification?.verifiedBy?.username&&e.jsxs("div",{className:"mt-1 flex justify-between",children:[e.jsx("span",{children:"Sortie vérifiée par"}),e.jsxs("strong",{children:[n.receiptVerification.exitVerification.verifiedBy.username,n.receiptVerification.exitVerification.verifiedAt?` · ${j(n.receiptVerification.exitVerification.verifiedAt)}`:""]})]})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:h(n.subtotal)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:h(n.total)})]})]}),e.jsxs("div",{className:"dialog-actions",children:[ie(n)&&e.jsxs("button",{type:"button",onClick:()=>De(n),className:"btn btn-primary",children:[e.jsx(Je,{"aria-hidden":"true"}),"Imprimer le reçu"]}),ie(n)&&e.jsxs("button",{type:"button",onClick:()=>Me(n),className:"btn btn-secondary",children:[e.jsx(Ge,{"aria-hidden":"true"}),"Télécharger PDF"]}),e.jsxs("button",{onClick:()=>Ue(n),disabled:n.status==="voided"||n.status==="corrected"||n.saleEditApproval?.status==="pending",className:"btn btn-secondary",children:[e.jsx(ee,{"aria-hidden":"true"}),"Modifier la vente"]}),e.jsx("button",{type:"button",onClick:()=>R(!1),className:"btn btn-ghost",children:"Fermer"})]})]})]})}),ct&&b&&e.jsx(ue,{label:"Détails des modifications",onClose:()=>Y(!1),children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails des modifications - ",b.saleId]}),e.jsx("button",{type:"button","aria-label":"Fermer",onClick:()=>Y(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx(q,{className:"w-5 h-5","aria-hidden":"true"})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg",children:"État actuel de la vente"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Client"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[b.customer.name," (",b.customer.phone,")"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total actuel"}),e.jsx("p",{className:"text-sm font-medium text-gray-900",children:h(b.total)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:b.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Articles"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[b.items.length," article(s)"]})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Historique des modifications"}),e.jsx("div",{className:"space-y-4",children:b.editHistory&&b.editHistory.length>0?b.editHistory.map((t,s)=>e.jsxs("div",{className:"border border-gray-200 rounded-lg p-4 bg-gray-50",children:[e.jsxs("div",{className:"flex justify-between items-start mb-3",children:[e.jsxs("div",{children:[e.jsxs("h5",{className:"font-medium text-gray-900",children:["Modification #",b.editHistory.length-s]}),e.jsx("p",{className:"text-sm text-gray-600",children:j(t.editedAt)})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Par: ",t.editedBy]}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Raison: ",t.reason]})]})]}),t.changes&&Object.keys(t.changes).length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h6",{className:"font-medium text-gray-700 text-sm",children:"Changements détaillés:"}),Object.entries(t.changes).map(([a,r])=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-3",children:[e.jsxs("div",{className:"font-medium text-gray-700 text-sm capitalize mb-2",children:[a.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",children:[e.jsxs("div",{className:"bg-red-50 p-3 rounded border border-red-200",children:[e.jsx("div",{className:"text-red-700 font-medium mb-1",children:"Avant:"}),e.jsx("div",{className:"text-red-600 break-words",children:typeof r.from=="object"?JSON.stringify(r.from,null,2):String(r.from||"N/A")})]}),e.jsxs("div",{className:"bg-green-50 p-3 rounded border border-green-200",children:[e.jsx("div",{className:"text-green-700 font-medium mb-1",children:"Après:"}),e.jsx("div",{className:"text-green-600 break-words",children:typeof r.to=="object"?JSON.stringify(r.to,null,2):String(r.to||"N/A")})]})]})]},a))]})]},t._id||s)):e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(pe,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun détail de modification disponible"})]})})]}),e.jsx("div",{className:"flex gap-3 pt-4 border-t border-gray-200",children:e.jsx("button",{onClick:()=>Y(!1),className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})}),nt&&f&&e.jsx(ue,{label:"Edit Sale",onClose:K,children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Edit Sale - ",f.saleId]}),e.jsx("button",{type:"button","aria-label":"Fermer",onClick:K,className:"text-gray-400 hover:text-gray-600",children:e.jsx(q,{className:"w-5 h-5","aria-hidden":"true"})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[W&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:W}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Information sur le client"}),e.jsxs("label",{className:"flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit",children:[e.jsx("input",{type:"checkbox",checked:d.isWalkIn,onChange:Ft,className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (nom facultatif, sans téléphone)"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"saleshistory-field-115345",className:"block text-sm font-medium text-gray-700 mb-1",children:["Nom ",d.isWalkIn?e.jsx("span",{className:"font-normal text-gray-400",children:"(facultatif)"}):e.jsx("span",{className:"text-red-600","aria-hidden":"true",children:"*"})]}),e.jsx("input",{id:"saleshistory-field-115345",type:"text",value:d.customer.name,onChange:t=>x(s=>({...s,customer:{...s.customer,name:t.target.value}})),placeholder:d.isWalkIn?"Client de passage":void 0,className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-116167",className:"block text-sm font-medium text-gray-700 mb-1",children:"Numéro de téléphone"}),e.jsx("input",{id:"saleshistory-field-116167",type:"tel",value:d.customer.phone,onChange:t=>x(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"saleshistory-field-116976",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{id:"saleshistory-field-116976",type:"email",value:d.customer.email,onChange:t=>x(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Methode de payement"}),e.jsxs("select",{value:d.paymentMethod,onChange:t=>x(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Cash"}),e.jsx("option",{value:"card",children:"Card"}),e.jsx("option",{value:"transfer",children:"Transfer"}),e.jsx("option",{value:"other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:ce,disabled:Q,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(X,{className:`w-3 h-3 ${Q?"animate-spin":""}`})," ","Refresh Products"]}),e.jsxs("button",{onClick:Mt,disabled:w.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(Ze,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),w.length===0&&!Q&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:d.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),Q?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Loading products..."}):w.length===0?e.jsx("input",{"aria-label":"Product name",type:"text",value:t.name,onChange:a=>{const r=[...d.items];r[s].name=a.target.value,x(l=>({...l,items:r}))},placeholder:"Product name",className:"w-full p-2 border rounded"}):e.jsx("select",{value:t.productId,onChange:a=>Ut(s,a.target.value),className:"w-full p-2 border rounded",children:w.map(a=>e.jsxs("option",{value:a._id,children:[a.name," — ",h(a.price)]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{"aria-label":"Prix",type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>Rt(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:["Nombre de pièces"," "]}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{"aria-label":"Diminuer",type:"button",onClick:()=>me(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(Zt,{className:"w-3 h-3"})}),e.jsx("input",{"aria-label":"Nombre de pièces",type:"number",min:"1",value:t.quantity,onChange:a=>me(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{"aria-label":"Ajouter",type:"button",onClick:()=>me(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(Ze,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:h(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>Dt(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(We,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:h(zt)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:h(Lt)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de modification"}),e.jsx("textarea",{"aria-label":"Veuillez indiquer une raison pour la modification de cette vente....",value:d.reason,onChange:t=>x(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette vente....",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx("button",{onClick:Ot,disabled:ae||d.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:ae?e.jsxs(e.Fragment,{children:[e.jsx(X,{className:"w-4 h-4 animate-spin"})," Updating..."]}):e.jsxs(e.Fragment,{children:[e.jsx(ee,{className:"w-4 h-4"})," Mettre à jour la vente"]})}),e.jsx("button",{onClick:K,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Cancel"})]})]})]})})]})}export{As as default};
