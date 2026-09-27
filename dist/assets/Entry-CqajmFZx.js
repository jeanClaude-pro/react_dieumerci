import{r as s,q as H,p as e,i as B,U as V,s as _,l as J}from"./index-CgI5oCu1.js";import{a as W}from"./salePricing-B6Q10MKn.js";import{D as N}from"./dollar-sign-C5Ue2qqd.js";import{R as E}from"./refresh-cw-WbVeyKSM.js";import{C as K}from"./calculator-BwDUaeOx.js";import{F as Q}from"./file-text-BIFn2sK2.js";const j=_;function X(i){return i==="cash"?"cash":i==="card"?"card":i==="mpesa"||i==="bank"?"transfer":"other"}async function Y(i){return(i.headers.get("content-type")||"").includes("application/json")?i.json():{__nonJson:!0,text:await i.text()}}function ie(){const[i,u]=s.useState(!1),[r,C]=s.useState(null),[n,F]=s.useState(null),[R,f]=s.useState(!0),k=s.useRef(null),{user:T}=H(),[t,l]=s.useState({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"usd"}),[b,h]=s.useState(null),[x,v]=s.useState(null),$=["Paiement Client","Dépôt Bancaire","Reçu d'Espèces","Remboursement Prêt","Investissement","Revenue Divers","Transfert Mobile","Autre Source"],S=["Revenue Ventes","Dépôt Espèces","Remboursement","Prêt","Investissement","Revenue Divers","Autre Catégorie"],A=async()=>{try{f(!0);const o=await fetch(`${j}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(o.ok){const a=await o.json();F(a)}else console.warn("Failed to load exchange rate")}catch(o){console.error("Error loading exchange rate:",o)}finally{f(!1)}};s.useEffect(()=>{A()},[]),s.useEffect(()=>{if(t.currencyMode==="fc"&&t.amountInFC&&n){const a=(parseFloat(t.amountInFC)||0)/n.rate;l(d=>({...d,amount:a.toFixed(2)}))}},[t.amountInFC,t.currencyMode,n]),s.useEffect(()=>{if(t.currencyMode==="usd"&&t.amount&&n){const a=(parseFloat(t.amount)||0)*n.rate;l(d=>({...d,amountInFC:Math.round(a).toString()}))}},[t.amount,t.currencyMode,n]);const g=parseFloat(t.amount)>0&&t.source.trim()!==""&&t.category.trim()!==""&&t.receivedFromName.trim()!==""&&t.receivedFromPhone.trim()!=="";function c(o){l(a=>({...a,[o.target.name]:o.target.value}))}const M=()=>{l(o=>({...o,currencyMode:o.currencyMode==="usd"?"fc":"usd",amount:"",amountInFC:""}))};function I(){const o=localStorage.getItem("token")||"";return o?{Authorization:`Bearer ${o}`}:{}}const z=o=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(o)+" FC",D=o=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(o),U=()=>{const o=window.open("","_blank","width=320,height=600");o&&r&&(o.document.write(`
<html>
  <head>
    <title>Reçu d'Entrée d'Argent</title>
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
      .entry-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
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
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
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
      .description {
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
        <div class="shop-name"><strong>${r.shopName}</strong></div>
        <div class="shop-details"><strong>${r.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${r.shopNumber}</strong></div>
        <div class="shop-details"><strong>${r.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${r.date}</strong></div>
        <div class="shop-details">REÇU #: <strong>${r.receiptNumber}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>💰 ENTRÉE D'ARGENT CONFIRMÉE 💰</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">REÇU DE: <strong>${r.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">TÉLÉPHONE: <strong>${r.receivedFrom.phone}</strong></div>
        ${r.receivedFrom.email?`<div class="sender-field">EMAIL: <strong>${r.receivedFrom.email}</strong></div>`:""}
      </div>
      
      ${r.description?`
        <div class="description">
          <strong>DESCRIPTION:</strong> <strong>${r.description}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">DÉTAILS DE L'ENTRÉE</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>SOURCE:</strong></div>
          <div class="detail-value"><strong>${r.source}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>CATÉGORIE:</strong></div>
          <div class="detail-value"><strong>${r.category}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${r.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>MONTANT REÇU:</strong></div>
          <div><strong>${r.enteredCurrency==="FC"?`${r.enteredAmount.toLocaleString("fr-FR")} FC`:`$${r.enteredAmount.toFixed(2)}`}</strong></div>
        </div>
        ${r.enteredCurrency==="FC"?`<div class="amount-row">
                 <div><strong>ÉQUIVALENT FC:</strong></div>
                 <div><strong>$${r.amountUSD.toFixed(2)}</strong></div>
               </div>`:""}
      </div>
      
      <div class="agent-info">
        Enregistré par: <strong>${r.agent.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>ENTRÉE ENREGISTRÉE AVEC SUCCÈS !</strong></div>
        <div class="warning"><strong>Conserver ce reçu comme preuve</strong></div>
        <div class="warning"><strong>Merci pour votre confiance</strong></div>
        <div class="thank-you"><strong>À BIENTÔT !</strong></div>
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
`),o.document.close())},P=()=>{const o=window.open("","_blank","width=320,height=600");o&&r&&(o.document.write(`
<html>
  <head>
    <title>Souche Entrée d'Argent</title>
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
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
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
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
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
      .description {
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
        <div class="shop-name"><strong>${r.shopName}</strong></div>
        <div class="shop-details"><strong>${r.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${r.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${r.date}</strong></div>
        <div class="shop-details">REÇU #: <strong>${r.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>SOUCHE ENTRÉE N°${r.stubNumber}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">REÇU DE: <strong>${r.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">TÉLÉPHONE: <strong>${r.receivedFrom.phone}</strong></div>
      </div>
      
      ${r.description?`
        <div class="description">
          <strong>DESCRIPTION:</strong> <strong>${r.description}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">DÉTAILS ENTRÉE</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>SOURCE:</strong></div>
          <div class="detail-value"><strong>${r.source}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>CATÉGORIE:</strong></div>
          <div class="detail-value"><strong>${r.category}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${r.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>MONTANT REÇU:</strong></div>
          <div><strong>${r.enteredCurrency==="FC"?`${r.enteredAmount.toLocaleString("fr-FR")} FC`:`$${r.enteredAmount.toFixed(2)}`}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        Enregistré par: <strong>${r.agent.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE ENTRÉE D'ARGENT</strong></div>
        <div class="warning"><strong>${r.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Reçu #: <strong>${r.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${r.date}</strong></div>
        <div class="warning">Source: <strong>${r.source}</strong></div>
        <div class="warning">Montant: <strong>${r.enteredCurrency==="FC"?`${r.enteredAmount.toLocaleString("fr-FR")} FC`:`$${r.enteredAmount.toFixed(2)}`}</strong></div>
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
`),o.document.close())},O=()=>{U(),setTimeout(()=>{P()},2e3)};s.useEffect(()=>{if(r){const o=setTimeout(()=>{O()},500);return()=>clearTimeout(o)}},[r]);async function L(o){if(o.preventDefault(),!!g){u(!0),h(null),v(null);try{const a=X(t.paymentMethod),d=W(parseFloat(t.currencyMode==="fc"?t.amountInFC:t.amount),t.currencyMode==="fc"?"FC":"USD",n?.rate),w={amount:d.amountUSD,...d,source:t.source,category:t.category,paymentMethod:a,description:t.description,receivedFrom:{name:t.receivedFromName,phone:t.receivedFromPhone,email:t.receivedFromEmail||""}};console.log("Sending entry data:",w);const p=await fetch(`${j}/entries`,{method:"POST",headers:{"Content-Type":"application/json",...I()},body:JSON.stringify(w)}),m=await Y(p);if(!p.ok){const G=m?.error||m?.text||`Échec de l'enregistrement (${p.status})`;throw new Error(G)}console.log("Entry created successfully:",m);const y=m.entryId||m._id,q={shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",amount:d.amountUSD,...d,source:t.source,category:t.category,paymentMethod:t.paymentMethod,description:t.description,receivedFrom:{name:t.receivedFromName,phone:t.receivedFromPhone,email:t.receivedFromEmail},agent:T?.username||"Agent",date:J(),receiptNumber:y,stubNumber:y,exchangeRate:n?.rate};C(q),l({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"usd"}),h("✅ Entrée d'argent enregistrée avec succès ! Impression du reçu et de la souche...")}catch(a){console.error("Error creating entry:",a),v(a?.message||"L'entrée d'argent n'a pas pu être enregistrée")}finally{u(!1)}}}return e.jsx("div",{className:"flex-1 p-6 overflow-auto",children:e.jsxs("div",{className:"max-w-4xl mx-auto",children:[e.jsx("div",{className:"mb-6",children:e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:"Nouvelle Entrée d'Argent"}),e.jsx("p",{className:"text-gray-600 mt-1",children:"Enregistrez une nouvelle entrée d'argent dans le système"})]}),e.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5 text-blue-600"}),e.jsx("span",{className:"font-semibold text-blue-900",children:"Taux du jour:"})]}),R?e.jsx(E,{className:"w-4 h-4 animate-spin text-blue-600"}):n?e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat("fr-FR").format(n.rate)," FC"]}),e.jsxs("div",{className:"text-xs text-blue-600",children:["Effectif depuis ",B(n.effectiveFrom)]})]}):e.jsx("span",{className:"text-red-600 text-sm",children:"Taux non disponible"})]})})]})}),b&&e.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:b}),x&&e.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:x}),e.jsxs("form",{onSubmit:L,className:"space-y-6",children:[e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[e.jsx(N,{className:"w-5 h-5 text-green-600"}),"Informations de l'Entrée"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{className:"block font-medium text-gray-700",children:"Montant *"}),e.jsxs("button",{type:"button",onClick:M,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[e.jsx(K,{className:"w-3 h-3"}),t.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),t.currencyMode==="usd"?e.jsx("input",{type:"number",step:"0.01",name:"amount",value:t.amount,onChange:o=>l({...t,amount:o.target.value}),placeholder:"Entrer le montant en USD",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"0.01",required:!0}):e.jsx("input",{type:"number",name:"amountInFC",value:t.amountInFC,onChange:o=>l({...t,amountInFC:o.target.value}),placeholder:"Entrer le montant en FC",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"1",required:!0}),t.amount&&t.currencyMode==="usd"&&n&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",z(parseFloat(t.amount)*n.rate)]}),t.amountInFC&&t.currencyMode==="fc"&&n&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",D(parseFloat(t.amountInFC)/n.rate)]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Source *"}),e.jsxs("select",{name:"source",value:t.source,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"",children:"Sélectionner la source"}),$.map(o=>e.jsx("option",{value:o,children:o},o))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Catégorie *"}),e.jsxs("select",{name:"category",value:t.category,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"",children:"Sélectionner la catégorie"}),S.map(o=>e.jsx("option",{value:o,children:o},o))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Méthode de Paiement *"}),e.jsxs("select",{name:"paymentMethod",value:t.paymentMethod,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),e.jsx("option",{value:"bank",children:"Transfert Bancaire"}),e.jsx("option",{value:"card",children:"Carte Visa"}),e.jsx("option",{value:"other",children:"Autre"})]})]})]}),e.jsxs("div",{className:"mt-4",children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Description (Optionnel)"}),e.jsx("textarea",{name:"description",value:t.description,onChange:c,placeholder:"Description de l'entrée d'argent...",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[e.jsx(V,{className:"w-5 h-5 text-blue-600"}),"Informations de l'Expéditeur"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Nom de l'Expéditeur *"}),e.jsx("input",{type:"text",name:"receivedFromName",value:t.receivedFromName,onChange:c,placeholder:"Entrer le nom de la personne",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Téléphone de l'Expéditeur *"}),e.jsx("input",{type:"tel",name:"receivedFromPhone",value:t.receivedFromPhone,onChange:c,placeholder:"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block mb-2 font-medium text-gray-700",children:"Email de l'Expéditeur (Optionnel)"}),e.jsx("input",{type:"email",name:"receivedFromEmail",value:t.receivedFromEmail,onChange:c,placeholder:"Entrer l'email de l'expéditeur",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsx("button",{type:"submit",disabled:!g||i,className:`w-full px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${g&&!i?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:i?e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(E,{className:"w-5 h-5 animate-spin"}),"Enregistrement en cours..."]}):e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(Q,{className:"w-5 h-5"}),"Enregistrer l'Entrée d'Argent"]})}),!g&&e.jsx("p",{className:"text-sm text-orange-600 mt-2 text-center",children:"* Veuillez remplir tous les champs obligatoires (Montant, Source, Catégorie, Nom et Téléphone)"})]})]}),e.jsx("div",{ref:k,style:{display:"none"}})]})})}export{ie as default};
