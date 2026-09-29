import{w as i,F as q,v as e,y as H,q as V}from"./index-BhsWK9C0.js";import{P as G}from"./PageHeader-D8NPXNjT.js";import{E as _,C as B}from"./ExchangeRateChip-BoZacKmw.js";import{a as J}from"./salePricing-B6Q10MKn.js";import{b as W}from"./api-C2eywpbT.js";import{T as K}from"./triangle-alert-BbUzfBpC.js";import{D as Q}from"./dollar-sign-A8a3eyT0.js";import{C as X}from"./calculator-B2Anhg1r.js";import{U as Y}from"./user-_wnKnTMn.js";import{R as Z}from"./refresh-cw-DJ_XUwey.js";import{F as ee}from"./file-text-D05WJpC2.js";const te=H;function re(a){return a==="cash"?"cash":a==="card"?"card":a==="mpesa"||a==="bank"?"transfer":"other"}async function oe(a){return(a.headers.get("content-type")||"").includes("application/json")?a.json():{__nonJson:!0,text:await a.text()}}function fe(){const[a,u]=i.useState(!1),[r,N]=i.useState(null),[n,F]=i.useState(null),[j,h]=i.useState(!0),C=i.useRef(null),p=i.useRef(!1),{user:R}=q(),[t,l]=i.useState({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"usd"}),[v,x]=i.useState(null),[y,w]=i.useState(null),k=["Paiement Client","Dépôt Bancaire","Reçu d'Espèces","Remboursement Prêt","Investissement","Revenue Divers","Transfert Mobile","Autre Source"],M=["Revenue Ventes","Dépôt Espèces","Remboursement","Prêt","Investissement","Revenue Divers","Autre Catégorie"],$=async()=>{try{h(!0);const o=await fetch(`${te}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(o.ok){const s=await o.json();F(s)}else console.warn("Failed to load exchange rate")}catch(o){console.error("Error loading exchange rate:",o)}finally{h(!1)}};i.useEffect(()=>{$()},[]),i.useEffect(()=>{if(t.currencyMode==="fc"&&t.amountInFC&&n){const s=(parseFloat(t.amountInFC)||0)/n.rate;l(d=>({...d,amount:s.toFixed(2)}))}},[t.amountInFC,t.currencyMode,n]),i.useEffect(()=>{if(t.currencyMode==="usd"&&t.amount&&n){const s=(parseFloat(t.amount)||0)*n.rate;l(d=>({...d,amountInFC:Math.round(s).toString()}))}},[t.amount,t.currencyMode,n]);const E=Number(t.currencyMode==="fc"?t.amountInFC:t.amount),g=Number.isFinite(E)&&E>0&&(t.currencyMode!=="fc"||Number.isFinite(n?.rate)&&(n?.rate??0)>0)&&t.source.trim()!==""&&t.category.trim()!==""&&t.receivedFromName.trim()!==""&&t.receivedFromPhone.trim()!=="";function c(o){l(s=>({...s,[o.target.name]:o.target.value}))}const T=()=>{l(o=>({...o,currencyMode:o.currencyMode==="usd"?"fc":"usd",amount:"",amountInFC:""}))},A=o=>new Intl.NumberFormat("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:0}).format(o)+" FC",S=o=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(o),I=()=>{const o=window.open("","_blank","width=320,height=600");o&&r&&(o.document.write(`
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
`),o.document.close())},z=()=>{const o=window.open("","_blank","width=320,height=600");o&&r&&(o.document.write(`
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
`),o.document.close())},D=()=>{I(),setTimeout(()=>{z()},2e3)};i.useEffect(()=>{if(r){const o=setTimeout(()=>{D()},500);return()=>clearTimeout(o)}},[r]);async function U(o){if(o.preventDefault(),!(!g||p.current)){p.current=!0,u(!0),x(null),w(null);try{const s=re(t.paymentMethod),d=J(parseFloat(t.currencyMode==="fc"?t.amountInFC:t.amount),t.currencyMode==="fc"?"FC":"USD",n?.rate),P={amount:d.amountUSD,...d,source:t.source,category:t.category,paymentMethod:s,description:t.description,receivedFrom:{name:t.receivedFromName,phone:t.receivedFromPhone,email:t.receivedFromEmail||""}},f=await W("entries",{method:"POST",body:JSON.stringify(P)}),m=await oe(f);if(!f.ok){const L=m?.error||m?.message||m?.text||`Échec de l'enregistrement (${f.status})`;throw new Error(L)}const b=m.entryId||m._id,O={shopName:"ETS. DIEU MERCI",shopAddress:"Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",shopNumber:"+243 977 771 421 / +243 853 549 102",shopRegistration:"RCCM: 14-A-017885",amount:d.amountUSD,...d,source:t.source,category:t.category,paymentMethod:t.paymentMethod,description:t.description,receivedFrom:{name:t.receivedFromName,phone:t.receivedFromPhone,email:t.receivedFromEmail},agent:R?.username||"Agent",date:V(),receiptNumber:b,stubNumber:b,exchangeRate:n?.rate};N(O),l({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"usd"}),x(`Entrée ${b} enregistrée avec succès. Impression du reçu et de la souche…`)}catch(s){console.error("Error creating entry:",s),w(s?.message||"L'entrée d'argent n'a pas pu être enregistrée")}finally{p.current=!1,u(!1)}}}return e.jsx("div",{className:"page page-narrow",children:e.jsxs("div",{children:[e.jsx(G,{title:"Entrée de caisse",description:"Enregistrer une entrée d'argent, son expéditeur et son mode de paiement.",actions:e.jsx(_,{loading:j,rate:n})}),v&&e.jsxs("div",{className:"alert alert-success mb-4",role:"status",children:[e.jsx(B,{"aria-hidden":"true"}),e.jsxs("span",{children:[v," ",e.jsx("a",{href:"/entryhistory",className:"underline",children:"Voir l'historique des entrées"})]})]}),y&&e.jsxs("div",{className:"alert alert-danger mb-4",role:"alert",children:[e.jsx(K,{"aria-hidden":"true"}),e.jsx("span",{children:y})]}),e.jsxs("form",{onSubmit:U,className:"space-y-6",children:[e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[e.jsx(Q,{className:"w-5 h-5 text-green-600"}),"Informations de l'Entrée"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{className:"block font-medium text-gray-700",children:"Montant *"}),e.jsxs("button",{type:"button",onClick:T,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[e.jsx(X,{className:"w-3 h-3"}),t.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),t.currencyMode==="usd"?e.jsx("input",{"aria-label":"Montant *",type:"number",step:"0.01",name:"amount",value:t.amount,onChange:o=>l({...t,amount:o.target.value}),placeholder:"Entrer le montant en USD",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"0.01",required:!0}):e.jsx("input",{"aria-label":"Montant *",type:"number",name:"amountInFC",value:t.amountInFC,onChange:o=>l({...t,amountInFC:o.target.value}),placeholder:"Entrer le montant en FC",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"1",required:!0}),t.amount&&t.currencyMode==="usd"&&n&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",A(parseFloat(t.amount)*n.rate)]}),t.amountInFC&&t.currencyMode==="fc"&&n&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",S(parseFloat(t.amountInFC)/n.rate)]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"entry-field-34674",className:"block mb-2 font-medium text-gray-700",children:"Source *"}),e.jsxs("select",{id:"entry-field-34674",name:"source",value:t.source,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"",children:"Sélectionner la source"}),k.map(o=>e.jsx("option",{value:o,children:o},o))]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"entry-field-35456",className:"block mb-2 font-medium text-gray-700",children:"Catégorie *"}),e.jsxs("select",{id:"entry-field-35456",name:"category",value:t.category,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"",children:"Sélectionner la catégorie"}),M.map(o=>e.jsx("option",{value:o,children:o},o))]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"entry-field-36266",className:"block mb-2 font-medium text-gray-700",children:"Méthode de Paiement *"}),e.jsxs("select",{id:"entry-field-36266",name:"paymentMethod",value:t.paymentMethod,onChange:c,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),e.jsx("option",{value:"bank",children:"Transfert Bancaire"}),e.jsx("option",{value:"card",children:"Carte Visa"}),e.jsx("option",{value:"other",children:"Autre"})]})]})]}),e.jsxs("div",{className:"mt-4",children:[e.jsx("label",{htmlFor:"entry-field-37169",className:"block mb-2 font-medium text-gray-700",children:"Description (Optionnel)"}),e.jsx("textarea",{id:"entry-field-37169",name:"description",value:t.description,onChange:c,placeholder:"Description de l'entrée d'argent...",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[e.jsx(Y,{className:"w-5 h-5 text-blue-600"}),"Informations de l'Expéditeur"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"entry-field-38178",className:"block mb-2 font-medium text-gray-700",children:"Nom de l'Expéditeur *"}),e.jsx("input",{id:"entry-field-38178",type:"text",name:"receivedFromName",value:t.receivedFromName,onChange:c,placeholder:"Entrer le nom de la personne",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"entry-field-38804",className:"block mb-2 font-medium text-gray-700",children:"Téléphone de l'Expéditeur *"}),e.jsx("input",{id:"entry-field-38804",type:"tel",name:"receivedFromPhone",value:t.receivedFromPhone,onChange:c,placeholder:"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:"entry-field-39464",className:"block mb-2 font-medium text-gray-700",children:"Email de l'Expéditeur (Optionnel)"}),e.jsx("input",{id:"entry-field-39464",type:"email",name:"receivedFromEmail",value:t.receivedFromEmail,onChange:c,placeholder:"Entrer l'email de l'expéditeur",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsx("button",{type:"submit",disabled:!g||a,className:`w-full px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${g&&!a?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:a?e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(Z,{className:"w-5 h-5 animate-spin"}),"Enregistrement en cours..."]}):e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(ee,{className:"w-5 h-5"}),"Enregistrer l'Entrée d'Argent"]})}),!g&&e.jsx("p",{className:"text-sm text-orange-600 mt-2 text-center",children:"* Veuillez remplir tous les champs obligatoires (Montant, Source, Catégorie, Nom et Téléphone)"})]})]}),e.jsx("div",{ref:C,style:{display:"none"}})]})})}export{fe as default};
