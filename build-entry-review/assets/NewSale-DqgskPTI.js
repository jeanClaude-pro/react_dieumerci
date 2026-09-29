import{m as ee,w as c,F as Be,v as t,e as ue,P as Ve,E as He,k as Je,y as Ke,q as Ge}from"./index-BhsWK9C0.js";import{P as Xe}from"./PageHeader-D8NPXNjT.js";import{E as Ye,C as B}from"./ExchangeRateChip-BoZacKmw.js";import{M as Ze,Q as et}from"./browser-BiM8GhGz.js";import{b as tt,k as we,c as rt,d as nt,g as at}from"./salePricing-B6Q10MKn.js";import{T as he}from"./triangle-alert-BbUzfBpC.js";import{S as it,T as st}from"./trash-2-deBHFsnj.js";import{L as ot}from"./lock-fmUx6LH6.js";import{P as ge}from"./plus-DL6wMmR0.js";import{C as fe}from"./circle-x-D_4GTZft.js";const ct=[["path",{d:"M16 10h2",key:"8sgtl7"}],["path",{d:"M16 14h2",key:"epxaof"}],["path",{d:"M6.17 15a3 3 0 0 1 5.66 0",key:"n6f512"}],["circle",{cx:"9",cy:"11",r:"2",key:"yxgjnd"}],["rect",{x:"2",y:"5",width:"20",height:"14",rx:"2",key:"qneu4z"}]],lt=ee("id-card",ct);const dt=[["path",{d:"M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",key:"e7tb2h"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["line",{x1:"12",x2:"12",y1:"22",y2:"12",key:"a4e8g8"}],["path",{d:"m17 13 5 5m-5 0 5-5",key:"im3w4b"}]],mt=ee("package-x",dt);const pt=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],ut=ee("user-round",pt),ht="Client de passage";function gt(a){if(a.isWalkIn){const g=a.customerName.trim();return g?{name:g,phone:"",email:""}:void 0}return{name:a.customerName,phone:a.customerPhone,email:""}}function ft(a){return a.isWalkIn?a.customerName.trim()||ht:a.customerName}function xt(a){return a.isWalkIn||a.customerName.trim()!==""&&a.customerPhone.trim()!==""}const te=a=>`${new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(a)}FC`,xe=(a,g)=>{const p=nt(a,g);return`${a.priceUSD.toFixed(2)}$${p===void 0?"":` / ${te(p)}`}`},be=(a,g)=>{const p=at(a,g);return`${(a.priceUSD*a.quantity).toFixed(2)}$${p===void 0?"":` / ${te(p)}`}`},Z=(a,g,p)=>{const u=we(a,g,p);return`${a.toFixed(2)}$${u===void 0?"":` / ${te(u)}`}`},$=Ke;function bt(a){return a==="cash"?"cash":a==="card"?"card":a==="mpesa"||a==="bank"?"transfer":"other"}async function ve(a){return(a.headers.get("content-type")||"").includes("application/json")?a.json():{__nonJson:!0,text:await a.text()}}class ye{static async printReceipt(g,p="sale"){try{const u=await fetch(`${$}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:g,type:p})});if(!u.ok)throw new Error("Failed to print receipt");return(await u.json()).success}catch(u){throw console.error("Print receipt error:",u),u}}static async printStub(g,p="sale"){try{const u=await fetch(`${$}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:g,type:p})});if(!u.ok)throw new Error("Failed to print stub");return(await u.json()).success}catch(u){throw console.error("Print stub error:",u),u}}}function Et(){const[a,g]=c.useState([]),[p,u]=c.useState(!0),[E,re]=c.useState(!1),[m,F]=c.useState([]),[n,je]=c.useState(null),[d,Ne]=c.useState(null),[ke,ne]=c.useState(!0),[w,D]=c.useState(""),[L,C]=c.useState(!1),[I,Ce]=c.useState({shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",receiptFooter:"Merci pour votre confiance ! À bientôt."}),Se=c.useRef(null),V=c.useRef(null),{user:S}=Be(),T=S?.role==="admin"||S?.role==="manager"||(S?.actionPermissions??[]).includes("edit_receipts"),[s,b]=c.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!0,paymentMethod:"cash",currencyMode:"usd",priceSource:"USD"}),[R,ae]=c.useState(null),[A,f]=c.useState(null),[q,H]=c.useState(-1),ie=c.useRef(null),O=S?.role==="admin";c.useEffect(()=>{const e=r=>{V.current&&!V.current.contains(r.target)&&C(!1)};return document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[]);const Pe=async()=>{try{const e=await fetch(`${$}/settings/receipt`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();Ce({shopName:r.shopName||"ETS. DIEU MERCI",shopAddress:r.shopAddress||"",shopNumber:r.shopNumber||"",shopRegistration:r.shopRegistration||"",receiptFooter:r.receiptFooter||""})}}catch(e){console.warn("Could not load shop settings, using defaults:",e)}},$e=async()=>{try{ne(!0);const e=await fetch(`${$}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();Ne(r)}else console.warn("Failed to load exchange rate")}catch(e){console.error("Error loading exchange rate:",e)}finally{ne(!1)}};c.useEffect(()=>{let e=!1;async function r(){u(!0),f(null);try{await Promise.all([i(),$e(),Pe()])}catch(o){e||f(o?.message||"Failed to load initial data")}finally{e||u(!1)}}async function i(){try{const o=await fetch(`${$}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),l=await ve(o);if(!o.ok){const U=l?.error||l?.text||`Products fetch failed: ${o.status}`;throw new Error(U)}const v=Array.isArray(l?.products)?l.products:Array.isArray(l)&&!l.__nonJson?l:[];e||g(v)}catch(o){e||f(o?.message||"Failed to load products")}}return r(),()=>{e=!0}},[]);const h=c.useMemo(()=>a.find(e=>e._id===s.productId),[a,s.productId]),M=c.useMemo(()=>w.trim()?a.filter(e=>e.name.toLowerCase().includes(w.toLowerCase())||e.sku&&e.sku.toLowerCase().includes(w.toLowerCase())):a,[a,w]),y=parseInt(s.quantity)||0,J=parseFloat(s.priceSource==="FC"?s.priceInFC:s.unitPrice)||0,N=c.useMemo(()=>{if(J<=0)return null;try{return tt(J,s.priceSource,d?.rate)}catch{return null}},[J,d?.rate,s.priceSource]),P=m.reduce((e,r)=>e+r.total,0),_=m.reduce((e,r)=>(e[r.enteredCurrency]+=r.enteredPrice*r.quantity,e),{USD:0,FC:0}),K=m.length>0&&xt(s);function z(e){b(r=>({...r,[e.target.name]:e.target.value}))}function se(e){b(r=>r.isWalkIn===e?r:{...r,isWalkIn:e,customerPhone:e?"":r.customerPhone})}const oe=e=>{b(r=>({...r,productId:e._id,unitPrice:e.price?e.price.toString():"",priceInFC:e.price&&d?Math.round(e.price*d.rate).toString():"",priceSource:"USD"})),D(e.name),C(!1)},Ee=e=>{D(e.target.value),C(!0),e.target.value||b(r=>({...r,productId:""}))};c.useEffect(()=>H(-1),[w,L]);const Fe=e=>{e.key==="ArrowDown"?(e.preventDefault(),C(!0),H(r=>Math.min(r+1,M.length-1))):e.key==="ArrowUp"?(e.preventDefault(),H(r=>Math.max(r-1,0))):e.key==="Enter"&&L&&M[q]?(e.preventDefault(),oe(M[q])):e.key==="Escape"&&C(!1)};c.useEffect(()=>{(R||A)&&ie.current?.scrollIntoView({block:"nearest",behavior:"smooth"})},[R,A]);const Q=(e,r)=>{const i=a.find(l=>l._id===e);if(!i)return!1;const o=m.filter(l=>l.productId===e).reduce((l,v)=>l+v.quantity,0);return rt(i.stock,o,r)},ce=()=>{b(e=>({...e,currencyMode:e.currencyMode==="usd"?"fc":"usd"}))},Ie=e=>{const r=parseFloat(e);b(i=>({...i,unitPrice:e,priceInFC:d&&Number.isFinite(r)?Math.round(r*d.rate).toString():"",priceSource:"USD"}))},Te=e=>{const r=parseFloat(e);b(i=>({...i,priceInFC:e,unitPrice:d&&Number.isFinite(r)?(r/d.rate).toString():"",priceSource:"FC"}))};c.useEffect(()=>{d&&b(e=>e.priceSource==="USD"&&e.unitPrice&&!e.priceInFC?{...e,priceInFC:Math.round(parseFloat(e.unitPrice)*d.rate).toString()}:e.priceSource==="FC"&&e.priceInFC&&!e.unitPrice?{...e,unitPrice:(parseFloat(e.priceInFC)/d.rate).toString()}:e)},[d]);const Re=e=>e.stock===0?{label:O?`Stock : ${e.stock}`:"En rupture",tone:"danger"}:e.stock<=5?{label:O?`Stock : ${e.stock}`:"Stock faible",tone:"warning"}:{label:O?`Stock : ${e.stock}`:"En stock",tone:"success"},Ae=(e,r)=>{const i=e&&r>0&&Q(e._id,r);if(O){const o=m.filter(v=>v.productId===e._id).reduce((v,U)=>v+U.quantity,0),l=e.stock-o;return t.jsxs("div",{className:"flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 num","aria-live":"polite",children:[t.jsxs("span",{children:["Stock disponible : ",t.jsx("strong",{className:"text-gray-900",children:e.stock})]}),o>0&&t.jsxs("span",{className:"text-blue-700",children:["Déjà dans le panier : ",o]}),r>0&&t.jsxs("span",{className:`inline-flex items-center gap-1 ${i?"text-green-700":"text-red-700"}`,children:[i?t.jsx(B,{className:"w-4 h-4","aria-hidden":"true"}):t.jsx(fe,{className:"w-4 h-4","aria-hidden":"true"}),"Stock restant après vente :"," ",l-r>=0?l-r:"pas assez de stock"]})]})}else{const o=e.stock===0?{tone:"danger",text:"En rupture de stock"}:e.stock<=5?{tone:"warning",text:"Stock faible"}:r>0&&!i?{tone:"danger",text:"Quantité demandée non disponible"}:r>0?{tone:"success",text:"Stock suffisant"}:{tone:"success",text:"En stock"},l=o.tone==="success"?B:o.tone==="warning"?he:fe;return t.jsxs("span",{className:`badge badge-${o.tone}`,"aria-live":"polite",children:[t.jsx(l,{"aria-hidden":"true"}),o.text]})}};function qe(){if(!h){f("Veuillez sélectionner un produit");return}if(y<=0){f("La quantité doit être supérieure à zéro");return}if(!N){f("Le prix unitaire doit être supérieur à zéro");return}if(!Q(h._id,y)){f("Stock insuffisant pour ajouter cette quantité au panier");return}f(null);const e=N.priceUSD,r=m.findIndex(i=>i.productId===h._id&&i.enteredCurrency===N.enteredCurrency&&i.enteredPrice===N.enteredPrice&&i.exchangeRate===N.exchangeRate);if(r>=0){const i=[...m];i[r]={...i[r],quantity:i[r].quantity+y,total:(i[r].quantity+y)*i[r].unitPrice},F(i)}else F([...m,{productId:h._id,name:h.name,quantity:y,unitPrice:e,total:y*e,...N}]);b(i=>({...i,quantity:"",unitPrice:h.price?h.price.toString():"",priceInFC:h.price&&d?Math.round(h.price*d.rate).toString():"",priceSource:"USD"})),D("")}function Me(e){const r=[...m];r.splice(e,1),F(r)}function le(e,r){const i=m[e];if(!i)return;const o=i.quantity+r;if(o<1)return;if(r>0&&!Q(i.productId,r)){f("Stock insuffisant pour ajouter cette quantité au panier");return}f(null);const l=[...m];l[e]={...i,quantity:o,total:o*i.unitPrice},F(l)}function ze(){const e=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return e?{Authorization:`Bearer ${e}`}:{}}const Ue=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>Sale Receipt</title>
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
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
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
      .receipt-qr {
        text-align: center;
        margin: 2mm auto;
        padding: 1mm;
        background: #fff;
      }
      .receipt-qr img {
        width: 42mm;
        height: 42mm;
        image-rendering: pixelated;
      }
      .qr-promo {
        margin-top: 0.5mm;
        font-size: 9px;
        line-height: 1.15;
        text-align: center;
      }
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
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
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
        <div class="shop-name"><strong>${n.shopName}</strong></div>
        <div class="shop-details"><strong>${n.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${n.shopNumber}</strong></div>
        <div class="shop-details"><strong>${n.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${n.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${n.receiptNumber}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${n.customerName.toUpperCase()}</strong></div>
        ${n.customerPhone?`<div class="customer-field">TELEPHONE: <strong>${n.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">ARTICLES ACHETES</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${n.items.map(r=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-quantity"><strong>${r.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${xe(r,n.exchangeRate)} = ${be(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${Z(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${Z(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${n.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${n.salesPerson.toUpperCase()}</strong>
      </div>

      ${n.qrDataUrl?`<div class="receipt-qr"><img src="${n.qrDataUrl}" alt="QR de contrôle du paiement" /><div class="qr-promo"><div><strong>UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?</strong></div><div>Gestion, ventes, stock & bien plus</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>`:""}
      
      <div class="footer">
        <div class="thank-you"><strong>${n.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
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
`),e.document.close())},De=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>Sale Stub</title>
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
      .stub-container {
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
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
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
      .stub-number {
        font-size: 11px;
        font-weight: bold;
        margin: 2mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
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
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 2mm; 
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .receipt-qr {
        text-align: center;
        margin: 2mm auto;
        padding: 1mm;
        background: #fff;
      }
      .receipt-qr img {
        width: 42mm;
        height: 42mm;
        image-rendering: pixelated;
      }
      .qr-promo {
        margin-top: 0.5mm;
        font-size: 9px;
        line-height: 1.15;
        text-align: center;
      }
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
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
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
        .stub-container { 
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
    <div class="stub-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${n.shopName}</strong></div>
        <div class="shop-details"><strong>${n.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${n.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${n.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${n.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        SOUCHE N°<strong>${n.stubNumber}</strong>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${n.customerName.toUpperCase()}</strong></div>
        ${n.customerPhone?`<div class="customer-field">TELEPHONE: <strong>${n.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">ARTICLES VENDUS</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${n.items.map(r=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-quantity"><strong>${r.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${xe(r,n.exchangeRate)} = ${be(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>TOTAL VENTE:</strong></div>
          <div><strong>${Z(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${n.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${n.salesPerson.toUpperCase()}</strong>
      </div>

      ${n.qrDataUrl?`<div class="receipt-qr"><img src="${n.qrDataUrl}" alt="QR de contrôle du paiement" /><div class="qr-promo"><div><strong>UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?</strong></div><div>Gestion, ventes, stock & bien plus</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>`:""}
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE DE CAISSE</strong></div>
        <div class="warning"><strong>${n.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Recu #: <strong>${n.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${n.date}</strong></div>
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
`),e.document.close())},de=()=>{Ue(),setTimeout(()=>{De()},2e3)},Le=async e=>{try{return console.log("Attempting ESC/POS printing..."),await ye.printReceipt(e,"sale"),await ye.printStub(e,"sale"),console.log("ESC/POS printing successful"),!0}catch(r){return console.error("ESC/POS printing failed, falling back to browser printing:",r),de(),!1}};c.useEffect(()=>{if(n){const e=setTimeout(async()=>{try{await Le(n)}catch(r){console.error("Printing failed:",r),de()}},500);return()=>clearTimeout(e)}},[n]);async function Oe(e){if(e.preventDefault(),!!K){re(!0),ae(null),f(null);try{const r={customer:gt(s),isWalkIn:s.isWalkIn,items:m.map(x=>({productId:x.productId,name:x.name,quantity:x.quantity,price:x.unitPrice,enteredPrice:x.enteredPrice,enteredCurrency:x.enteredCurrency,priceUSD:x.priceUSD,priceFC:x.priceFC,exchangeRate:x.exchangeRate})),subtotal:P,total:P,paymentMethod:bt(s.paymentMethod),salesPerson:S?.username||"unknown",exchangeRate:m[0]?.exchangeRate??d?.rate},i=await fetch(`${$}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...ze()},body:JSON.stringify(r)}),o=await ve(i);if(!i.ok){const x=o?.error||o?.text||`Sale failed (${i.status})`;throw new Error(x)}if(!o.receiptToken)throw new Error("Le serveur n'a pas retourné le QR sécurisé du reçu");const l=await et.toDataURL(o.receiptToken,{errorCorrectionLevel:"M",margin:4,width:320,color:{dark:"#000000",light:"#ffffff"}}),v=o.saleId||o._id,U={shopName:I.shopName,shopAddress:I.shopAddress,shopNumber:I.shopNumber,shopRegistration:I.shopRegistration,receiptFooter:I.receiptFooter,customerName:ft(s),customerPhone:s.isWalkIn?"":s.customerPhone,items:m,total:P,paymentMethod:s.paymentMethod,salesPerson:S?.username||"Agent",date:Ge(),receiptNumber:v,stubNumber:v,qrToken:o.receiptToken,qrDataUrl:l};je(U),b({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!0,paymentMethod:s.paymentMethod,currencyMode:"usd",priceSource:"USD"}),F([]),D(""),ae("Vente effectuée avec succès. Impression du reçu et de la souche…")}catch(r){f(r?.message||"La vente n'a pas pu être effectuée")}finally{re(!1)}}}const j=e=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(e),k=e=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(e)+" FC",_e=h&&y>0&&N!==null&&Q(h._id,y),W=m.reduce((e,r)=>e+r.quantity,0),me=we(P,m,d?.rate),G=_.FC>0,X=L?M:[],Y=m.length===0?"Ajoutez au moins un article pour valider.":K?null:"Nom et téléphone du client enregistré requis.",Qe=e=>e.enteredCurrency==="FC"?{main:k(e.enteredPrice),alt:`≈ ${j(e.priceUSD)}`}:{main:j(e.enteredPrice),alt:e.priceFC!==void 0?`≈ ${k(e.priceFC)}`:""},We=e=>e.enteredCurrency==="FC"?{main:k(e.enteredPrice*e.quantity),alt:`≈ ${j(e.total)}`}:{main:j(e.enteredPrice*e.quantity),alt:e.priceFC!==void 0?`≈ ${k(e.priceFC*e.quantity)}`:""},pe=e=>t.jsxs("button",{type:"button",onClick:Oe,disabled:!K||E,className:`btn btn-success btn-lg ${e}`,"aria-describedby":Y?"pos-checkout-hint":void 0,children:[E?t.jsx(ue,{className:"animate-spin","aria-hidden":"true"}):t.jsx(B,{"aria-hidden":"true"}),E?"Enregistrement…":"Valider la vente"]});return t.jsxs("div",{className:"page page-wide",children:[t.jsx(Xe,{title:"Nouvelle vente",description:"Client, articles, panier puis encaissement.",actions:t.jsx(Ye,{loading:ke,rate:d})}),(R||A)&&t.jsxs("div",{ref:ie,className:"grid gap-2 mb-4",style:{scrollMarginTop:"1rem",scrollMarginBottom:"6rem"},children:[R&&t.jsxs("div",{className:"alert alert-success",role:"status",children:[t.jsx(B,{"aria-hidden":"true"}),t.jsx("span",{children:R})]}),A&&t.jsxs("div",{className:"alert alert-danger",role:"alert",children:[t.jsx(he,{"aria-hidden":"true"}),t.jsx("span",{children:A})]})]}),t.jsxs("div",{className:"pos-grid",children:[t.jsxs("div",{className:"pos-main",children:[t.jsxs("section",{className:"card pos-area-customer","aria-labelledby":"pos-customer-title",children:[t.jsxs("div",{className:"card-header",children:[t.jsxs("h2",{id:"pos-customer-title",className:"section-title",children:[t.jsx("span",{className:"pos-step","aria-hidden":"true",children:"1"}),"Client"]}),t.jsxs("div",{className:"segmented",role:"group","aria-label":"Type de client",children:[t.jsxs("button",{type:"button","aria-pressed":s.isWalkIn,onClick:()=>se(!0),children:[t.jsx(ut,{"aria-hidden":"true"}),"De passage"]}),t.jsxs("button",{type:"button","aria-pressed":!s.isWalkIn,onClick:()=>se(!1),children:[t.jsx(lt,{"aria-hidden":"true"}),"Enregistré"]})]})]}),t.jsx("div",{className:"card-body grid gap-4",children:s.isWalkIn?t.jsxs("div",{className:"field",children:[t.jsxs("label",{htmlFor:"pos-walkin-name",className:"field-label",children:["Nom du client ",t.jsx("span",{className:"opt",children:"(facultatif)"})]}),t.jsx("input",{id:"pos-walkin-name",type:"text",name:"customerName",value:s.customerName,onChange:z,placeholder:"Client de passage",autoComplete:"off",maxLength:80,className:"input","aria-describedby":"pos-walkin-hint"}),t.jsx("p",{id:"pos-walkin-hint",className:"field-hint",children:"Aucun téléphone requis. Le nom figure sur le reçu ; aucune fiche client n'est créée."})]}):t.jsxs("div",{className:"grid gap-4 sm:grid-cols-2 pos-customer-fields",children:[t.jsxs("div",{className:"field",children:[t.jsxs("label",{htmlFor:"pos-customer-name",className:"field-label",children:["Nom du client ",t.jsx("span",{className:"req","aria-hidden":"true",children:"*"})]}),t.jsx("input",{id:"pos-customer-name",type:"text",name:"customerName",value:s.customerName,onChange:z,placeholder:"Nom complet",autoComplete:"off",className:"input",required:!0,"aria-required":"true"})]}),t.jsxs("div",{className:"field",children:[t.jsxs("label",{htmlFor:"pos-customer-phone",className:"field-label",children:["Téléphone ",t.jsx("span",{className:"req","aria-hidden":"true",children:"*"})]}),t.jsx("input",{id:"pos-customer-phone",type:"tel",inputMode:"tel",name:"customerPhone",value:s.customerPhone,onChange:z,placeholder:"+243 …",autoComplete:"off",className:"input",required:!0,"aria-required":"true"})]})]})})]}),t.jsxs("section",{className:"card pos-area-products","aria-labelledby":"pos-products-title",children:[t.jsxs("div",{className:"card-header",children:[t.jsxs("h2",{id:"pos-products-title",className:"section-title",children:[t.jsx("span",{className:"pos-step","aria-hidden":"true",children:"2"}),"Ajouter un article"]}),p&&t.jsxs("span",{className:"badge",children:[t.jsx(ue,{className:"animate-spin","aria-hidden":"true"}),"Chargement…"]})]}),t.jsxs("div",{className:"card-body grid gap-4",children:[t.jsxs("div",{className:"field relative",ref:V,children:[t.jsx("label",{htmlFor:"pos-search",className:"field-label",children:"Article"}),t.jsxs("div",{className:"input-group",children:[t.jsx(it,{"aria-hidden":"true"}),t.jsx("input",{id:"pos-search",type:"search",role:"combobox","aria-expanded":X.length>0,"aria-controls":"pos-search-results","aria-autocomplete":"list","aria-activedescendant":q>=0?`pos-result-${q}`:void 0,value:w,onChange:Ee,onFocus:()=>C(!0),onKeyDown:Fe,placeholder:p?"Chargement des articles…":"Nom ou référence de l'article",autoComplete:"off",className:"input",disabled:p||a.length===0})]}),X.length>0&&t.jsx("div",{id:"pos-search-results",role:"listbox","aria-label":"Articles trouvés",className:"pos-results",children:X.map((e,r)=>{const i=Re(e);return t.jsxs("button",{type:"button",role:"option",id:`pos-result-${r}`,"aria-selected":r===q,className:"pos-result",onMouseDown:o=>o.preventDefault(),onClick:()=>oe(e),children:[t.jsxs("span",{className:"min-w-0",children:[t.jsx("strong",{className:"truncate",children:e.name}),e.sku&&t.jsxs("small",{children:["Réf. ",e.sku]})]}),t.jsx("span",{className:`badge badge-${i.tone} num`,children:i.label})]},e._id)})}),L&&w&&M.length===0&&t.jsx("div",{className:"pos-results",role:"status",children:t.jsxs("p",{className:"px-3 py-4 text-center text-sm text-gray-500",children:["Aucun article ne correspond à « ",w," »."]})})]}),!p&&a.length===0&&t.jsxs("div",{className:"alert alert-warning",children:[t.jsx(mt,{"aria-hidden":"true"}),t.jsx("span",{children:"Aucun article disponible à la vente pour le moment."})]}),h&&t.jsxs("div",{className:"pos-selected",children:[t.jsx(Ve,{className:"w-5 h-5 text-blue-600 shrink-0","aria-hidden":"true"}),t.jsxs("div",{className:"min-w-0 flex-1 grid gap-1 justify-items-start",children:[t.jsx("strong",{className:"text-sm font-semibold text-gray-900 truncate max-w-full",children:h.name}),Ae(h,y)]})]}),t.jsxs("div",{className:"grid gap-4 sm:grid-cols-2",children:[t.jsxs("div",{className:"field",children:[t.jsx("label",{htmlFor:"pos-quantity",className:"field-label",children:"Quantité"}),t.jsx("input",{id:"pos-quantity",type:"number",inputMode:"numeric",name:"quantity",value:s.quantity,onChange:z,placeholder:"0",className:"input num",min:1})]}),t.jsxs("div",{className:"field",children:[t.jsxs("div",{className:"flex items-center justify-between gap-2",children:[t.jsxs("label",{htmlFor:"pos-price",className:"field-label",children:["Prix unitaire ",t.jsxs("span",{className:"sr-only",children:["en ",s.currencyMode==="usd"?"USD":"FC"]})]}),t.jsxs("div",{className:"segmented pos-currency",role:"group","aria-label":"Devise de saisie du prix",children:[t.jsx("button",{type:"button","aria-pressed":s.currencyMode==="usd",onClick:()=>s.currencyMode!=="usd"&&ce(),children:"USD"}),t.jsx("button",{type:"button","aria-pressed":s.currencyMode==="fc",onClick:()=>s.currencyMode!=="fc"&&ce(),children:"FC"})]})]}),s.currencyMode==="usd"?t.jsx("input",{id:"pos-price",type:"number",inputMode:"decimal",step:"0.01",name:"unitPrice",value:s.unitPrice,onChange:e=>T&&Ie(e.target.value),readOnly:!T,placeholder:h?.price?`ex : ${h.price}`:"Prix en USD",className:"input num",min:.01,"aria-describedby":"pos-price-hint"}):t.jsx("input",{id:"pos-price",type:"number",inputMode:"numeric",name:"priceInFC",value:s.priceInFC,onChange:e=>T&&Te(e.target.value),readOnly:!T,placeholder:"Prix en FC",className:"input num",min:1,"aria-describedby":"pos-price-hint"}),t.jsxs("p",{id:"pos-price-hint",className:"field-hint num flex flex-wrap gap-x-3 gap-y-1",children:[!T&&t.jsxs("span",{className:"inline-flex items-center gap-1 text-amber-700",children:[t.jsx(ot,{className:"w-3 h-3","aria-hidden":"true"}),"Prix verrouillé (permission requise)"]}),s.unitPrice&&s.currencyMode==="usd"&&d&&t.jsxs(t.Fragment,{children:["≈ ",k(parseFloat(s.unitPrice)*d.rate)]}),s.priceInFC&&s.currencyMode==="fc"&&d&&t.jsxs(t.Fragment,{children:["≈ ",j(parseFloat(s.priceInFC)/d.rate)]})]})]})]}),t.jsxs("button",{type:"button",onClick:qe,disabled:!_e,className:"btn btn-primary btn-lg w-full sm:w-auto sm:justify-self-start",children:[t.jsx(ge,{"aria-hidden":"true"}),"Ajouter au panier"]})]})]})]}),t.jsxs("div",{className:"pos-side",children:[t.jsxs("section",{className:"card pos-area-cart","aria-labelledby":"pos-cart-title",children:[t.jsxs("div",{className:"card-header",children:[t.jsxs("h2",{id:"pos-cart-title",className:"section-title",children:[t.jsx("span",{className:"pos-step","aria-hidden":"true",children:"3"}),"Panier"]}),t.jsxs("span",{className:"badge num","aria-live":"polite",children:[W," pièce",W>1?"s":""]})]}),t.jsx("div",{className:"card-body",children:m.length===0?t.jsx(He,{title:"Le panier est vide",icon:t.jsx(Je,{"aria-hidden":"true"}),children:"Recherchez un article, indiquez la quantité puis ajoutez-le au panier."}):t.jsx("ul",{className:"pos-cart-list","aria-label":"Articles du panier",children:m.map((e,r)=>{const i=Qe(e),o=We(e);return t.jsxs("li",{className:"pos-cart-item",children:[t.jsxs("div",{className:"min-w-0",children:[t.jsx("h3",{children:e.name}),t.jsxs("div",{className:"line-meta",children:[i.main,i.alt&&t.jsxs(t.Fragment,{children:[" · ",i.alt]})," / pièce"]})]}),t.jsxs("div",{className:"line-total",children:[o.main,o.alt&&t.jsx("div",{className:"line-meta font-normal",children:o.alt})]}),t.jsxs("div",{className:"pos-qty",role:"group","aria-label":`Quantité de ${e.name}`,children:[t.jsx("button",{type:"button",onClick:()=>le(r,-1),disabled:e.quantity<=1,"aria-label":`Retirer une pièce de ${e.name}`,children:t.jsx(Ze,{"aria-hidden":"true"})}),t.jsx("output",{"aria-live":"polite",children:e.quantity}),t.jsx("button",{type:"button",onClick:()=>le(r,1),"aria-label":`Ajouter une pièce de ${e.name}`,children:t.jsx(ge,{"aria-hidden":"true"})})]}),t.jsxs("button",{type:"button",onClick:()=>Me(r),className:"btn btn-ghost btn-sm justify-self-end text-red-700","aria-label":`Enlever ${e.name} du panier`,children:[t.jsx(st,{"aria-hidden":"true"}),"Enlever"]})]},r)})})})]}),t.jsxs("section",{className:"card pos-area-payment","aria-labelledby":"pos-payment-title",children:[t.jsx("div",{className:"card-header",children:t.jsxs("h2",{id:"pos-payment-title",className:"section-title",children:[t.jsx("span",{className:"pos-step","aria-hidden":"true",children:"4"}),"Encaissement"]})}),t.jsxs("div",{className:"card-body grid gap-4",children:[t.jsxs("div",{className:"field",children:[t.jsx("label",{htmlFor:"pos-payment-method",className:"field-label",children:"Méthode de paiement"}),t.jsxs("select",{id:"pos-payment-method",name:"paymentMethod",value:s.paymentMethod,onChange:z,className:"input",required:!0,children:[t.jsx("option",{value:"cash",children:"Cash"}),t.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),t.jsx("option",{value:"bank",children:"Transfert Bank"}),t.jsx("option",{value:"card",children:"Carte Visa"}),t.jsx("option",{value:"other",children:"Autres"})]})]}),t.jsxs("div",{className:"pos-total","aria-live":"polite",children:[G&&_.USD>0&&t.jsxs("div",{className:"pos-total-row",children:[t.jsx("span",{children:"Saisi en USD"}),t.jsx("span",{children:j(_.USD)})]}),G&&t.jsxs("div",{className:"pos-total-row",children:[t.jsx("span",{children:"Saisi en FC"}),t.jsx("span",{children:k(_.FC)})]}),t.jsxs("div",{className:"pos-total-row is-grand",children:[t.jsx("span",{children:G?"Total reçu":"Total"}),t.jsx("strong",{children:j(P)})]}),me!==void 0&&m.length>0&&t.jsxs("div",{className:"pos-total-row",children:[t.jsx("span",{children:"Équivalent"}),t.jsxs("span",{children:["≈ ",k(me)]})]})]}),t.jsx("div",{className:"pos-submit-inline grid",children:pe("btn-block")}),Y&&t.jsx("p",{id:"pos-checkout-hint",className:"field-hint text-center",children:Y})]})]})]}),t.jsxs("div",{className:"pos-checkout-bar",children:[t.jsxs("div",{className:"summary",children:[t.jsxs("small",{className:"truncate",children:[W," pièce",W>1?"s":""," · ",s.isWalkIn?s.customerName.trim()||"Client de passage":s.customerName.trim()||"Client enregistré"]}),t.jsx("strong",{children:j(P)})]}),pe("")]})]}),t.jsx("div",{ref:Se,style:{display:"none"}})]})}export{Et as default};
