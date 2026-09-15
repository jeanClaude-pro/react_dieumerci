import{r as d,q as Se,p as t,i as Pe,s as Ie,l as Ee}from"./index-_8JWpa0t.js";import{Q as Fe}from"./browser-rzCQz0hU.js";import{b as $e,c as Te,d as Re,g as Ae,k as Ue}from"./salePricing-B6Q10MKn.js";import{D as ze}from"./dollar-sign-UrwXY5br.js";import{R as W}from"./refresh-cw-Knf25D2k.js";import{S as qe}from"./search-Cod8WXeR.js";import{C as De}from"./calculator-DgaMEC_S.js";const Q=s=>`${new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(s)}FC`,ee=(s,h)=>{const g=Re(s,h);return`${s.priceUSD.toFixed(2)}$${g===void 0?"":` / ${Q(g)}`}`},te=(s,h)=>{const g=Ae(s,h);return`${(s.priceUSD*s.quantity).toFixed(2)}$${g===void 0?"":` / ${Q(g)}`}`},_=(s,h,g)=>{const m=Ue(s,h,g);return`${s.toFixed(2)}$${m===void 0?"":` / ${Q(m)}`}`},P=Ie;function Me(s){return s==="cash"?"cash":s==="card"?"card":s==="mpesa"||s==="bank"?"transfer":"other"}async function re(s){return(s.headers.get("content-type")||"").includes("application/json")?s.json():{__nonJson:!0,text:await s.text()}}class ne{static async printReceipt(h,g="sale"){try{const m=await fetch(`${P}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:h,type:g})});if(!m.ok)throw new Error("Failed to print receipt");return(await m.json()).success}catch(m){throw console.error("Print receipt error:",m),m}}static async printStub(h,g="sale"){try{const m=await fetch(`${P}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:h,type:g})});if(!m.ok)throw new Error("Failed to print stub");return(await m.json()).success}catch(m){throw console.error("Print stub error:",m),m}}}function He(){const[s,h]=d.useState([]),[g,m]=d.useState(!0),[I,B]=d.useState(!1),[u,T]=d.useState([]),[n,oe]=d.useState(null),[a,se]=d.useState(null),[ie,V]=d.useState(!0),[k,R]=d.useState(""),[H,A]=d.useState(!1),[E,ae]=d.useState({shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",receiptFooter:"Merci pour votre confiance ! À bientôt."}),de=d.useRef(null),q=d.useRef(null),{user:C}=Se(),y=C?.role==="admin"||C?.role==="manager"||(C?.actionPermissions??[]).includes("edit_receipts"),[o,f]=d.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:"cash",currencyMode:"usd",priceSource:"USD"}),[J,G]=d.useState(null),[K,b]=d.useState(null),Y=C?.role==="admin";d.useEffect(()=>{const e=r=>{q.current&&!q.current.contains(r.target)&&A(!1)};return document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[]);const ce=async()=>{try{const e=await fetch(`${P}/settings/receipt`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();ae({shopName:r.shopName||"ETS. DIEU MERCI",shopAddress:r.shopAddress||"",shopNumber:r.shopNumber||"",shopRegistration:r.shopRegistration||"",receiptFooter:r.receiptFooter||""})}}catch(e){console.warn("Could not load shop settings, using defaults:",e)}},le=async()=>{try{V(!0);const e=await fetch(`${P}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();se(r)}else console.warn("Failed to load exchange rate")}catch(e){console.error("Error loading exchange rate:",e)}finally{V(!1)}};d.useEffect(()=>{let e=!1;async function r(){m(!0),b(null);try{await Promise.all([i(),le(),ce()])}catch(c){e||b(c?.message||"Failed to load initial data")}finally{e||m(!1)}}async function i(){try{const c=await fetch(`${P}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),l=await re(c);if(!c.ok){const $=l?.error||l?.text||`Products fetch failed: ${c.status}`;throw new Error($)}const v=Array.isArray(l?.products)?l.products:Array.isArray(l)&&!l.__nonJson?l:[];e||h(v)}catch(c){e||b(c?.message||"Failed to load products")}}return r(),()=>{e=!0}},[]);const p=d.useMemo(()=>s.find(e=>e._id===o.productId),[s,o.productId]),D=d.useMemo(()=>k.trim()?s.filter(e=>e.name.toLowerCase().includes(k.toLowerCase())||e.sku&&e.sku.toLowerCase().includes(k.toLowerCase())):s,[s,k]),w=parseInt(o.quantity)||0,M=parseFloat(o.priceSource==="FC"?o.priceInFC:o.unitPrice)||0,N=d.useMemo(()=>{if(M<=0)return null;try{return $e(M,o.priceSource,a?.rate)}catch{return null}},[M,a?.rate,o.priceSource]),U=u.reduce((e,r)=>e+r.total,0),F=u.reduce((e,r)=>(e[r.enteredCurrency]+=r.enteredPrice*r.quantity,e),{USD:0,FC:0}),O=u.length>0&&(o.isWalkIn||o.customerName.trim()!==""&&o.customerPhone.trim()!=="");function z(e){f(r=>({...r,[e.target.name]:e.target.value}))}function me(){f(e=>({...e,isWalkIn:!e.isWalkIn,customerName:"",customerPhone:""}))}const pe=e=>{f(r=>({...r,productId:e._id,unitPrice:e.price?e.price.toString():"",priceInFC:e.price&&a?Math.round(e.price*a.rate).toString():"",priceSource:"USD"})),R(e.name),A(!1)},ge=e=>{R(e.target.value),A(!0),e.target.value||f(r=>({...r,productId:""}))},L=(e,r)=>{const i=s.find(l=>l._id===e);if(!i)return!1;const c=u.filter(l=>l.productId===e).reduce((l,v)=>l+v.quantity,0);return Te(i.stock,c,r)},ue=()=>{f(e=>({...e,currencyMode:e.currencyMode==="usd"?"fc":"usd"}))},he=e=>{const r=parseFloat(e);f(i=>({...i,unitPrice:e,priceInFC:a&&Number.isFinite(r)?Math.round(r*a.rate).toString():"",priceSource:"USD"}))},xe=e=>{const r=parseFloat(e);f(i=>({...i,priceInFC:e,unitPrice:a&&Number.isFinite(r)?(r/a.rate).toString():"",priceSource:"FC"}))};d.useEffect(()=>{a&&f(e=>e.priceSource==="USD"&&e.unitPrice&&!e.priceInFC?{...e,priceInFC:Math.round(parseFloat(e.unitPrice)*a.rate).toString()}:e.priceSource==="FC"&&e.priceInFC&&!e.unitPrice?{...e,unitPrice:(parseFloat(e.priceInFC)/a.rate).toString()}:e)},[a]);const fe=e=>Y?`(Stock: ${e.stock})`:e.stock===0?"(En rupture)":e.stock<=5?"(Stock faible)":"(En stock)",be=(e,r)=>{const i=e&&r>0&&L(e._id,r);if(Y){const c=u.filter(v=>v.productId===e._id).reduce((v,$)=>v+$.quantity,0),l=e.stock-c;return t.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Stock disponible: ",t.jsx("strong",{children:e.stock}),c>0&&t.jsxs("span",{className:"ml-2 text-blue-600",children:["(Déjà dans panier: ",c,")"]}),r>0&&t.jsxs("span",{className:`ml-4 ${i?"text-green-600":"text-red-600"}`,children:["Stock restant après vente:"," ",l-r>=0?l-r:"❌ pas assez de stock!"]})]})}else return e.stock===0?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:"❌ En rupture de stock"})}):e.stock<=5?t.jsx("p",{className:"text-sm text-orange-600 mb-4",children:t.jsx("strong",{children:"⚠️ Stock faible"})}):r>0&&!i?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:"❌ Quantité demandée non disponible"})}):r>0?t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:"✅ Stock suffisant"})}):t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:"✅ En stock"})})};function ve(){if(!p){b("Veuillez sélectionner un produit");return}if(w<=0){b("La quantité doit être supérieure à zéro");return}if(!N){b("Le prix unitaire doit être supérieur à zéro");return}if(!L(p._id,w)){b("Stock insuffisant pour ajouter cette quantité au panier");return}b(null);const e=N.priceUSD,r=u.findIndex(i=>i.productId===p._id&&i.enteredCurrency===N.enteredCurrency&&i.enteredPrice===N.enteredPrice&&i.exchangeRate===N.exchangeRate);if(r>=0){const i=[...u];i[r]={...i[r],quantity:i[r].quantity+w,total:(i[r].quantity+w)*i[r].unitPrice},T(i)}else T([...u,{productId:p._id,name:p.name,quantity:w,unitPrice:e,total:w*e,...N}]);f(i=>({...i,quantity:"",unitPrice:p.price?p.price.toString():"",priceInFC:p.price&&a?Math.round(p.price*a.rate).toString():"",priceSource:"USD"})),R("")}function we(e){const r=[...u];r.splice(e,1),T(r)}function ye(){const e=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return e?{Authorization:`Bearer ${e}`}:{}}const Ne=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
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
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${ee(r,n.exchangeRate)} = ${te(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${_(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${_(n.total,n.items,n.exchangeRate)}</strong></div>
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
`),e.document.close())},je=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
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
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${ee(r,n.exchangeRate)} = ${te(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>TOTAL VENTE:</strong></div>
          <div><strong>${_(n.total,n.items,n.exchangeRate)}</strong></div>
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
`),e.document.close())},X=()=>{Ne(),setTimeout(()=>{je()},2e3)},ke=async e=>{try{return console.log("Attempting ESC/POS printing..."),await ne.printReceipt(e,"sale"),await ne.printStub(e,"sale"),console.log("ESC/POS printing successful"),!0}catch(r){return console.error("ESC/POS printing failed, falling back to browser printing:",r),X(),!1}};d.useEffect(()=>{if(n){const e=setTimeout(async()=>{try{await ke(n)}catch(r){console.error("Printing failed:",r),X()}},500);return()=>clearTimeout(e)}},[n]);async function Ce(e){if(e.preventDefault(),!!O){B(!0),G(null),b(null);try{const r={customer:o.isWalkIn?void 0:{name:o.customerName,phone:o.customerPhone,email:""},isWalkIn:o.isWalkIn,items:u.map(x=>({productId:x.productId,name:x.name,quantity:x.quantity,price:x.unitPrice,enteredPrice:x.enteredPrice,enteredCurrency:x.enteredCurrency,priceUSD:x.priceUSD,priceFC:x.priceFC,exchangeRate:x.exchangeRate})),subtotal:U,total:U,paymentMethod:Me(o.paymentMethod),salesPerson:C?.username||"unknown",exchangeRate:u[0]?.exchangeRate??a?.rate},i=await fetch(`${P}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...ye()},body:JSON.stringify(r)}),c=await re(i);if(!i.ok){const x=c?.error||c?.text||`Sale failed (${i.status})`;throw new Error(x)}if(!c.receiptToken)throw new Error("Le serveur n'a pas retourné le QR sécurisé du reçu");const l=await Fe.toDataURL(c.receiptToken,{errorCorrectionLevel:"M",margin:4,width:320,color:{dark:"#000000",light:"#ffffff"}}),v=c.saleId||c._id,$={shopName:E.shopName,shopAddress:E.shopAddress,shopNumber:E.shopNumber,shopRegistration:E.shopRegistration,receiptFooter:E.receiptFooter,customerName:o.isWalkIn?"Client de passage":o.customerName,customerPhone:o.isWalkIn?"":o.customerPhone,items:u,total:U,paymentMethod:o.paymentMethod,salesPerson:C?.username||"Agent",date:Ee(),receiptNumber:v,stubNumber:v,qrToken:c.receiptToken,qrDataUrl:l};oe($),f({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:o.paymentMethod,currencyMode:"usd",priceSource:"USD"}),T([]),R(""),G("✅ Vente effectuée avec succès ! Impression du reçu et de la souche...")}catch(r){b(r?.message||"La vente n'a pas pu être effectuée")}finally{B(!1)}}}const j=e=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(e),S=e=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(e)+" FC",Z=p&&w>0&&N!==null&&L(p._id,w);return t.jsx("div",{className:"flex-1 p-6 overflow-auto",children:t.jsxs("div",{className:"max-w-6xl mx-auto",children:[t.jsx("div",{className:"mb-6",children:t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:"Nouvelle Vente"}),t.jsx("p",{className:"text-gray-600 mt-1",children:"Créez une nouvelle vente avec gestion multi-devises"})]}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 w-full min-w-0 sm:w-auto sm:min-w-[280px]",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(ze,{className:"w-5 h-5 text-blue-600"}),t.jsx("span",{className:"font-semibold text-blue-900",children:"Taux du jour:"})]}),ie?t.jsx(W,{className:"w-4 h-4 animate-spin text-blue-600"}):a?t.jsxs("div",{className:"text-right",children:[t.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat("fr-FR").format(a.rate)," FC"]}),t.jsxs("div",{className:"text-xs text-blue-600",children:["Effectif depuis ",Pe(a.effectiveFrom)]})]}):t.jsx("span",{className:"text-red-600 text-sm",children:"Taux non disponible"})]})})]})}),J&&t.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:J}),K&&t.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:K}),t.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Ajouter les articles"}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[t.jsxs("div",{className:"relative",ref:q,children:[t.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Articles"}),t.jsxs("div",{className:"relative",children:[t.jsx(qe,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),t.jsx("input",{type:"text",value:k,onChange:ge,onFocus:()=>A(!0),placeholder:"Rechercher un article...",className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:g||s.length===0})]}),H&&D.length>0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:D.map(e=>t.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>pe(e),children:[t.jsx("div",{className:"font-medium text-gray-900",children:e.name}),t.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[t.jsx("span",{children:e.sku&&`SKU: ${e.sku}`}),t.jsx("span",{className:e.stock===0?"text-red-600":e.stock<=5?"text-orange-600":"text-green-600",children:fe(e)})]})]},e._id))}),H&&k&&D.length===0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:"Aucun article trouvé"})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Nombre de pièces"}),t.jsx("input",{type:"number",name:"quantity",value:o.quantity,onChange:z,placeholder:"Entrer le nombre de pièces",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsx("label",{className:"block font-medium text-gray-700",children:"Prix unitaire"}),t.jsxs("button",{type:"button",onClick:ue,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[t.jsx(De,{className:"w-3 h-3"}),o.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),!y&&t.jsx("p",{className:"text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2",children:"Prix verrouillé — permission requise pour modifier les prix."}),o.currencyMode==="usd"?t.jsx("input",{type:"number",step:"0.01",name:"unitPrice",value:o.unitPrice,onChange:e=>y&&he(e.target.value),readOnly:!y,placeholder:p?.price?`ex: ${p.price}`:"Entrer le prix en USD",className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${y?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:.01}):t.jsx("input",{type:"number",name:"priceInFC",value:o.priceInFC,onChange:e=>y&&xe(e.target.value),readOnly:!y,placeholder:"Entrer le prix en FC",className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${y?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:1}),o.unitPrice&&o.currencyMode==="usd"&&a&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",S(parseFloat(o.unitPrice)*a.rate)]}),o.priceInFC&&o.currencyMode==="fc"&&a&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",j(parseFloat(o.priceInFC)/a.rate)]})]})]}),p&&be(p,w),t.jsxs("button",{type:"button",onClick:ve,disabled:!Z,className:`w-full sm:w-auto px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${Z?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[t.jsx(W,{className:"w-4 h-4"}),"Ajouter au panier"]}),u.length>0&&t.jsxs("div",{className:"mt-6",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Articles du panier"}),t.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:t.jsxs("table",{className:"w-full",children:[t.jsx("thead",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:"Articles"}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Pièces"}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Prix unitaire"}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Total"}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Actions"})]})}),t.jsx("tbody",{className:"divide-y divide-gray-200",children:u.map((e,r)=>t.jsxs("tr",{className:"hover:bg-gray-50",children:[t.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:e.name}),t.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:e.quantity}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[e.enteredCurrency==="FC"?S(e.enteredPrice):j(e.enteredPrice),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",j(e.priceUSD)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",S(e.priceFC)]}):null]}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[e.enteredCurrency==="FC"?S(e.enteredPrice*e.quantity):j(e.enteredPrice*e.quantity),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",j(e.total)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",S(e.priceFC*e.quantity)]}):null]}),t.jsx("td",{className:"px-4 py-3 text-center",children:t.jsx("button",{onClick:()=>we(r),className:"text-red-600 hover:text-red-800 text-sm font-medium",children:"Enlever"})})]},r))}),t.jsx("tfoot",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:"Total:"}),t.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[F.USD>0&&t.jsx("div",{children:j(F.USD)}),F.FC>0&&t.jsx("div",{children:S(F.FC)}),F.FC>0&&t.jsxs("div",{className:"text-xs text-gray-500",children:["Total reçu ≈ ",j(U)]})]}),t.jsx("td",{})]})})]})})]})]}),t.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Informations du client"}),t.jsxs("label",{className:"flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none",children:[t.jsx("input",{type:"checkbox",checked:o.isWalkIn,onChange:me,className:"w-4 h-4"}),t.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (vente sans coordonnées client)"})]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[t.jsxs("div",{children:[t.jsxs("label",{className:"block mb-2 font-medium text-gray-700",children:["Nom du client ",!o.isWalkIn&&"*"]}),t.jsx("input",{type:"text",name:"customerName",value:o.customerName,onChange:z,placeholder:o.isWalkIn?"Client de passage":"Entrer le nom du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:o.isWalkIn,required:!o.isWalkIn})]}),t.jsxs("div",{children:[t.jsxs("label",{className:"block mb-2 font-medium text-gray-700",children:["Numéro de téléphone du client ",!o.isWalkIn&&"*"]}),t.jsx("input",{type:"tel",name:"customerPhone",value:o.customerPhone,onChange:z,placeholder:o.isWalkIn?"—":"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:o.isWalkIn})]}),t.jsxs("div",{children:[t.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Méthode de paiement"}),t.jsxs("select",{name:"paymentMethod",value:o.paymentMethod,onChange:z,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"cash",children:"Cash"}),t.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),t.jsx("option",{value:"bank",children:"Transfert Bank"}),t.jsx("option",{value:"card",children:"Carte Visa"}),t.jsx("option",{value:"other",children:"Autres"})]})]})]}),t.jsx("button",{type:"submit",onClick:Ce,disabled:!O||I,className:`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-base sm:text-lg ${O&&!I?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:I?t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(W,{className:"w-4 h-4 animate-spin"}),"En cours d'enregistrement..."]}):"Enregistrer la vente"})]}),t.jsx("div",{ref:de,style:{display:"none"}})]})})}export{He as default};
