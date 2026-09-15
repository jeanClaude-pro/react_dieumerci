import{r as i,q as je,p as e,i as Se,s as ke,m as Ce,l as Ee}from"./index-CK0uQDlX.js";import{b as Re,c as Te,d as Pe,k as $e}from"./salePricing-B6Q10MKn.js";import{D as Ie}from"./dollar-sign-C4Bf_2VI.js";import{R as q}from"./refresh-cw-C0WT_GEy.js";import{S as Ae}from"./search-BQUFkOjI.js";import{C as Fe}from"./calculator-ChELZbQl.js";const oe=s=>`${new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(s)}FC`,Y=(s,f)=>{const x=Pe(s,f);return`${s.priceUSD.toFixed(2)}$${x===void 0?"":` / ${oe(x)}`}`},_=(s,f,x)=>{const c=$e(s,f,x);return`${s.toFixed(2)}$${c===void 0?"":` / ${oe(c)}`}`},k=ke;function ee(s){return s==="cash"?"cash":s==="card"?"card":s==="mpesa"||s==="bank"?"transfer":"other"}async function te(s){return(s.headers.get("content-type")||"").includes("application/json")?s.json():{__nonJson:!0,text:await s.text()}}class re{static async printReceipt(f,x="sale"){try{const c=await fetch(`${k}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:f,type:x})});if(!c.ok)throw new Error("Failed to print receipt");return(await c.json()).success}catch(c){throw console.error("Print receipt error:",c),c}}static async printStub(f,x="sale"){try{const c=await fetch(`${k}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:f,type:x})});if(!c.ok)throw new Error("Failed to print stub");return(await c.json()).success}catch(c){throw console.error("Print stub error:",c),c}}}function qe(){const[s,f]=i.useState([]),[x,c]=i.useState(!0),[C,V]=i.useState(!1),[g,R]=i.useState([]),[o,ne]=i.useState(null),[a,se]=i.useState(null),[ae,B]=i.useState(!0),[N,T]=i.useState(""),[H,P]=i.useState(!1),ie=i.useRef(null),F=i.useRef(null),{user:$}=je(),[n,y]=i.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:"cash",notes:"",currencyMode:"usd",priceSource:"USD"}),[J,Q]=i.useState(null),[G,b]=i.useState(null),W=$?.role==="admin";i.useEffect(()=>{const t=r=>{F.current&&!F.current.contains(r.target)&&P(!1)};return document.addEventListener("mousedown",t),()=>{document.removeEventListener("mousedown",t)}},[]);const de=async()=>{try{B(!0);const t=await fetch(`${k}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const r=await t.json();se(r)}else console.warn("Failed to load exchange rate")}catch(t){console.error("Error loading exchange rate:",t)}finally{B(!1)}};i.useEffect(()=>{let t=!1;async function r(){c(!0),b(null);try{await Promise.all([l(),de()])}catch(m){t||b(m?.message||"Failed to load initial data")}finally{t||c(!1)}}async function l(){try{const m=await fetch(`${k}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),d=await te(m);if(!m.ok){const w=d?.error||d?.text||`Products fetch failed: ${m.status}`;throw new Error(w)}const h=Array.isArray(d?.products)?d.products:Array.isArray(d)&&!d.__nonJson?d:[];t||f(h)}catch(m){t||b(m?.message||"Failed to load products")}}return r(),()=>{t=!0}},[]);const u=i.useMemo(()=>s.find(t=>t._id===n.productId),[s,n.productId]),z=i.useMemo(()=>N.trim()?s.filter(t=>t.name.toLowerCase().includes(N.toLowerCase())||t.sku&&t.sku.toLowerCase().includes(N.toLowerCase())):s,[s,N]),v=parseInt(n.quantity)||0,M=parseFloat(n.priceSource==="FC"?n.priceInFC:n.unitPrice)||0,O=i.useMemo(()=>{if(M<=0)return null;try{return Re(M,n.priceSource,a?.rate)}catch{return null}},[M,n.priceSource,a?.rate]),E=O?.priceUSD||0,ce=v*E,j=g.reduce((t,r)=>t+r.total,0),D=g.length>0&&n.customerName.trim()!==""&&n.customerPhone.trim()!=="";function S(t){y(r=>({...r,[t.target.name]:t.target.value}))}const le=t=>{y(r=>({...r,productId:t._id,unitPrice:t.price?t.price.toString():"",priceInFC:t.price&&a?Math.round(t.price*a.rate).toString():"",priceSource:"USD"})),T(t.name),P(!1)},me=t=>{T(t.target.value),P(!0),t.target.value||y(r=>({...r,productId:""}))},U=(t,r)=>{const l=s.find(d=>d._id===t);if(!l)return!1;const m=g.filter(d=>d.productId===t).reduce((d,h)=>d+h.quantity,0);return Te(l.stock,m,r)},ue=()=>{y(t=>({...t,currencyMode:t.currencyMode==="usd"?"fc":"usd"}))},ge=t=>W?`(Stock: ${t.stock})`:t.stock===0?"(En rupture)":t.stock<=5?"(Stock faible)":"(En stock)",pe=(t,r)=>{const l=t&&r>0&&U(t._id,r);if(W){const m=g.filter(h=>h.productId===t._id).reduce((h,w)=>h+w.quantity,0),d=t.stock-m;return e.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Stock disponible: ",e.jsx("strong",{children:t.stock}),m>0&&e.jsxs("span",{className:"ml-2 text-blue-600",children:["(Déjà dans panier: ",m,")"]}),r>0&&e.jsxs("span",{className:`ml-4 ${l?"text-green-600":"text-red-600"}`,children:["Stock restant après réservation:"," ",d-r>=0?d-r:"❌ pas assez de stock!"]})]})}else return t.stock===0?e.jsx("p",{className:"text-sm text-red-600 mb-4",children:e.jsx("strong",{children:"❌ En rupture de stock"})}):t.stock<=5?e.jsx("p",{className:"text-sm text-orange-600 mb-4",children:e.jsx("strong",{children:"⚠️ Stock faible"})}):r>0&&!l?e.jsx("p",{className:"text-sm text-red-600 mb-4",children:e.jsx("strong",{children:"❌ Quantité demandée non disponible"})}):r>0?e.jsx("p",{className:"text-sm text-green-600 mb-4",children:e.jsx("strong",{children:"✅ Stock suffisant"})}):e.jsx("p",{className:"text-sm text-green-600 mb-4",children:e.jsx("strong",{children:"✅ En stock"})})};function xe(){if(!u){b("Veuillez sélectionner un produit");return}if(v<=0){b("La quantité doit être supérieure à zéro");return}if(!O){b("Le prix unitaire doit être supérieur à zéro");return}if(!U(u._id,v)){b("Stock insuffisant pour ajouter cette quantité au panier");return}b(null);const t=g.findIndex(r=>r.productId===u._id&&r.unitPrice===E);if(t>=0){const r=[...g];r[t]={...r[t],quantity:r[t].quantity+v,total:(r[t].quantity+v)*E},R(r)}else R([...g,{productId:u._id,name:u.name,quantity:v,unitPrice:E,total:ce,...O}]);y(r=>({...r,quantity:"",unitPrice:u.price?u.price.toString():"",priceInFC:u.price&&a?Math.round(u.price*a.rate).toString():"",priceSource:"USD"})),T("")}function he(t){const r=[...g];r.splice(t,1),R(r)}function K(){const t=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return t?{Authorization:`Bearer ${t}`}:{}}const fe=()=>{const t=window.open("","_blank","width=320,height=600");t&&(t.document.write(`
<html>
  <head>
    <title>Reservation Receipt</title>
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
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
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
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .reservation-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .reservation-info {
        background-color: #fffacd;
        border: 2px solid #ffd700;
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
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
      .notes {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
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
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${o.shopNumber}</strong></div>
        <div class="shop-details"><strong>${o.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${o.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="reservation-badge">
        <strong>⭐ RÉSERVATION CONFIRMÉE ⭐</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>DATE RESERVATION:</strong> <strong>${o.reservationDate}</strong></div>
        <div><strong>HEURE RESERVATION:</strong> <strong>${o.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${o.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${o.customerPhone}</strong></div>
        ${o.customerEmail?`<div class="customer-field">EMAIL: <strong>${o.customerEmail}</strong></div>`:""}
      </div>
      
      ${o.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${o.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${o.items.map(r=>`
        <div class="item-row">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-details">
            <strong>${r.quantity} x ${Y(r,o.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${_(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>ACOMPTE TOTAL:</strong></div>
          <div><strong>${_(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${o.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>MERCI POUR VOTRE RÉSERVATION !</strong></div>
        <div class="warning"><strong>Presentez ce reçu pour retirer vos articles</strong></div>
        <div class="warning"><strong>Validité: 7 jours</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
        <div class="thank-you"><strong>A BIENTOT !</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
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
`),t.document.close())},be=()=>{const t=window.open("","_blank","width=320,height=600");t&&(t.document.write(`
<html>
  <head>
    <title>Reservation Stub</title>
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
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .stub-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
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
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .stub-number {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .reservation-info {
        background-color: #fffacd;
        border: 2px solid #ffd700;
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
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
      .notes {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
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
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${o.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${o.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>SOUCHE RÉSERVATION N°${o.stubNumber}</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>DATE RESERVATION:</strong> <strong>${o.reservationDate}</strong></div>
        <div><strong>HEURE RESERVATION:</strong> <strong>${o.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${o.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${o.customerPhone}</strong></div>
      </div>
      
      ${o.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${o.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${o.items.map(r=>`
        <div class="item-row">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-details">
            <strong>${r.quantity} x ${Y(r,o.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>ACOMPTE PERÇU:</strong></div>
          <div><strong>${_(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${o.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE RÉSERVATION</strong></div>
        <div class="warning"><strong>${o.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Recu #: <strong>${o.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${o.date}</strong></div>
        <div class="warning">Client: <strong>${o.customerName}</strong></div>
        <div class="warning">Tel: <strong>${o.customerPhone}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
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
`),t.document.close())},Z=()=>{fe(),setTimeout(()=>{be()},2e3)},ve=async t=>{try{return console.log("Attempting ESC/POS printing for reservation..."),await re.printReceipt(t,"reservation"),await re.printStub(t,"reservation"),console.log("ESC/POS printing successful"),!0}catch(r){return console.error("ESC/POS printing failed, falling back to browser printing:",r),Z(),!1}};i.useEffect(()=>{if(o){const t=setTimeout(async()=>{try{await ve(o)}catch(r){console.error("Printing failed:",r),Z()}},500);return()=>clearTimeout(t)}},[o]);const I=t=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(t),A=t=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(t)+" FC",X=u&&v>0&&E>0&&U(u._id,v);async function ye(t){if(t.preventDefault(),!!D){V(!0),Q(null),b(null);try{const r=new Date,l=r.toLocaleDateString("fr-FR",{timeZone:"Africa/Lubumbashi"}),m=Ce(r),d={customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail||""},items:g.map(p=>({productId:p.productId,name:p.name,quantity:p.quantity,price:p.unitPrice,enteredPrice:p.enteredPrice,enteredCurrency:p.enteredCurrency,priceUSD:p.priceUSD,priceFC:p.priceFC,exchangeRate:p.exchangeRate})),subtotal:j,total:j,paymentMethod:ee(n.paymentMethod),salesPerson:$?.username||"unknown",reservationDate:l,reservationTime:m,notes:n.notes||"",type:"reservation",exchangeRate:g[0]?.exchangeRate??a?.rate},h=await fetch(`${k}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...K()},body:JSON.stringify(d)}),w=await te(h);if(!h.ok){const p=w?.error||w?.text||`Reservation failed (${h.status})`;throw new Error(p)}const we=w._id,L=w.saleId;try{(await fetch(`${k}/reservations/track`,{method:"POST",headers:{"Content-Type":"application/json",...K()},body:JSON.stringify({saleReference:we,saleId:L,customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail},items:g,total:j,paymentMethod:ee(n.paymentMethod),salesPerson:$?.username||"unknown",reservationDate:l,reservationTime:m,notes:n.notes})})).ok||console.warn("Failed to create reservation tracking, but sale was created")}catch(p){console.warn("Error creating reservation tracking:",p)}const Ne={shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",customerName:n.customerName,customerPhone:n.customerPhone,customerEmail:n.customerEmail,items:g,total:j,paymentMethod:n.paymentMethod,salesPerson:$?.username||"VENDEUR",date:Ee(),receiptNumber:L,stubNumber:L,reservationDate:l,reservationTime:m,notes:n.notes};ne(Ne),y({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:n.paymentMethod,notes:"",currencyMode:"usd",priceSource:"USD"}),R([]),T(""),Q("✅ Reservation effectuée avec succès ! Impression du reçu et de la souche...")}catch(r){b(r?.message||"La reservation n'a pas pu être effectuée")}finally{V(!1)}}}return e.jsx("div",{className:"flex-1 p-6 overflow-auto",children:e.jsxs("div",{className:"max-w-6xl mx-auto",children:[e.jsx("div",{className:"mb-6",children:e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:"Nouvelle Reservation"}),e.jsx("p",{className:"text-gray-600 mt-1",children:"Créez une nouvelle réservation avec gestion multi-devises"})]}),e.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ie,{className:"w-5 h-5 text-blue-600"}),e.jsx("span",{className:"font-semibold text-blue-900",children:"Taux du jour:"})]}),ae?e.jsx(q,{className:"w-4 h-4 animate-spin text-blue-600"}):a?e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat("fr-FR").format(a.rate)," FC"]}),e.jsxs("div",{className:"text-xs text-blue-600",children:["Effectif depuis ",Se(a.effectiveFrom)]})]}):e.jsx("span",{className:"text-red-600 text-sm",children:"Taux non disponible"})]})})]})}),J&&e.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:J}),G&&e.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:G}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Ajouter les articles à réserver"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[e.jsxs("div",{className:"relative",ref:F,children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Articles"}),e.jsxs("div",{className:"relative",children:[e.jsx(Ae,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",value:N,onChange:me,onFocus:()=>P(!0),placeholder:"Rechercher un article...",className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:x||s.length===0})]}),H&&z.length>0&&e.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:z.map(t=>e.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>le(t),children:[e.jsx("div",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[e.jsx("span",{children:t.sku&&`SKU: ${t.sku}`}),e.jsx("span",{className:t.stock===0?"text-red-600":t.stock<=5?"text-orange-600":"text-green-600",children:ge(t)})]})]},t._id))}),H&&N&&z.length===0&&e.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:"Aucun article trouvé"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Nombre de pièces"}),e.jsx("input",{type:"number",name:"quantity",value:n.quantity,onChange:S,placeholder:"Entrer le nombre de pièces",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{className:"block font-medium text-gray-700",children:"Prix unitaire"}),e.jsxs("button",{type:"button",onClick:ue,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[e.jsx(Fe,{className:"w-3 h-3"}),n.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),n.currencyMode==="usd"?e.jsx("input",{type:"number",step:"0.01",name:"unitPrice",value:n.unitPrice,onChange:t=>{const r=t.target.value,l=Number.parseFloat(r);y({...n,unitPrice:r,priceInFC:a&&Number.isFinite(l)?Math.round(l*a.rate).toString():"",priceSource:"USD"})},placeholder:u?.price?`ex: ${u.price}`:"Entrer le prix en USD",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:.01}):e.jsx("input",{type:"number",name:"priceInFC",value:n.priceInFC,onChange:t=>{const r=t.target.value,l=Number.parseFloat(r);y({...n,priceInFC:r,unitPrice:a&&Number.isFinite(l)?(l/a.rate).toString():"",priceSource:"FC"})},placeholder:"Entrer le prix en FC",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1}),n.unitPrice&&n.currencyMode==="usd"&&a&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",A(parseFloat(n.unitPrice)*a.rate)]}),n.priceInFC&&n.currencyMode==="fc"&&a&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",I(parseFloat(n.priceInFC)/a.rate)]})]})]}),u&&pe(u,v),e.jsxs("button",{type:"button",onClick:xe,disabled:!X,className:`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${X?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[e.jsx(q,{className:"w-4 h-4"}),"Ajouter au panier"]}),g.length>0&&e.jsxs("div",{className:"mt-6",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Articles du panier de réservation"}),e.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:"Articles"}),e.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Pièces"}),e.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Prix unitaire"}),e.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Total"}),e.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Actions"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-200",children:g.map((t,r)=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:t.quantity}),e.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[I(t.unitPrice),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(t.unitPrice*a.rate)]})]}),e.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[I(t.total),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(t.total*a.rate)]})]}),e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx("button",{onClick:()=>he(r),className:"text-red-600 hover:text-red-800 text-sm font-medium",children:"Enlever"})})]},r))}),e.jsx("tfoot",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:"Total:"}),e.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[I(j),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(j*a.rate)]})]}),e.jsx("td",{})]})})]})})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Informations du client"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Nom du client *"}),e.jsx("input",{type:"text",name:"customerName",value:n.customerName,onChange:S,placeholder:"Entrer le nom du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Numéro de téléphone du client *"}),e.jsx("input",{type:"tel",name:"customerPhone",value:n.customerPhone,onChange:S,placeholder:"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Email du client (optionnel)"}),e.jsx("input",{type:"email",name:"customerEmail",value:n.customerEmail,onChange:S,placeholder:"Entrer l'email du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Méthode de paiement"}),e.jsxs("select",{name:"paymentMethod",value:n.paymentMethod,onChange:S,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"cash",children:"Cash"}),e.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),e.jsx("option",{value:"bank",children:"Transfert Bank"}),e.jsx("option",{value:"card",children:"Carte Visa"}),e.jsx("option",{value:"other",children:"Autres"})]})]})]}),e.jsxs("div",{className:"mb-6",children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Notes (optionnel)"}),e.jsx("textarea",{name:"notes",value:n.notes,onChange:S,placeholder:"Notes supplémentaires pour la réservation",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]}),e.jsx("button",{type:"submit",onClick:ye,disabled:!D||C,className:`px-8 py-3 rounded-lg font-medium text-lg ${D&&!C?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:C?e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(q,{className:"w-4 h-4 animate-spin"}),"En cours d'enregistrement..."]}):"Confirmer la Reservation"})]}),e.jsx("div",{ref:ie,style:{display:"none"}})]})})}export{qe as default};
