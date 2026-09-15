import{r as d,s as $e,p as e,E as De,U as ie,P as Pe,i as Me,j as ze,m as Ue,l as Fe}from"./index-_8JWpa0t.js";import{S as Le}from"./search-Cod8WXeR.js";import{R as _}from"./refresh-cw-Knf25D2k.js";import{C as le}from"./calendar-kF7FMINT.js";import{P as de}from"./printer-BT0ijS1T.js";import{S as O}from"./square-pen-BHXIXchx.js";import{T as V}from"./trash-2-DDj2sb2q.js";import{C as B}from"./circle-check-big-t3zlPz__.js";import{C as ce}from"./circle-x-Bm1JI83J.js";import{P as qe,M as _e}from"./phone-DP7h26BS.js";import{P as me}from"./plus-Bdtb-q8L.js";import{M as Oe}from"./minus-CMSh5wT6.js";const N=$e;function tt(){const[w,v]=d.useState([]),[x,ue]=d.useState([]),[p,u]=d.useState(!0),[g,xe]=d.useState(""),[n,pe]=d.useState(null),[ge,j]=d.useState(!1),[he,A]=d.useState(!1),[I,G]=d.useState(null),[H,C]=d.useState(null),[S,i]=d.useState(null),[h,fe]=d.useState("all"),[R,be]=d.useState(""),[J,$]=d.useState(1),[b,ve]=d.useState(null),[k,je]=d.useState(null),[ye,W]=d.useState(!1),[y,K]=d.useState(null),[l,c]=d.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),[T,Q]=d.useState(!1);d.useEffect(()=>{D();const t=localStorage.getItem("user");let s="";try{s=t&&JSON.parse(t)?.role||""}catch{s=""}console.log("🔑 User Role:",s),be(s)},[]),d.useEffect(()=>{const t=window.setTimeout(()=>E(),250);return()=>window.clearTimeout(t)},[J,g,h]),d.useEffect(()=>{$(1)},[g,h]);const E=async()=>{try{u(!0),i(null),console.log("🔍 Fetching reservations from API...");const t=new URLSearchParams({page:String(J),limit:"50"});g.trim()&&t.set("search",g.trim()),h!=="all"&&t.set("status",h);const s=await fetch(`${N}/sales/reservations/all?${t}`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(s.ok){const a=await s.json();console.log("📦 Reservations API Response:",a),a?.success&&Array.isArray(a.data)?(console.log(`✅ Found ${a.length} reservations`),v(a.data),ve(a.pagination||null),je(a.summary||null)):(console.warn("❌ Invalid data format from API"),i("Format de données invalide reçu de l'API"),v([]))}else console.error("❌ Reservations endpoint failed, status:",s.status),i("Impossible de charger les réservations"),v([])}catch(t){console.error("❌ Error loading reservations:",t),i("Échec du chargement des réservations"),v([])}finally{u(!1)}},D=async()=>{try{Q(!0);const t=await fetch(`${N}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),ue(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{Q(!1)}},P=w.filter(t=>{const s=t.saleId.toLowerCase().includes(g.toLowerCase())||t.customer.name.toLowerCase().includes(g.toLowerCase())||t.customer.phone.includes(g)||t.customer.email&&t.customer.email.toLowerCase().includes(g.toLowerCase()),a=h==="all"||h==="pending"&&t.status==="pending"||h==="completed"&&t.status==="completed";return s&&a}),X=w.filter(t=>t.status==="pending"),Y=w.filter(t=>t.status==="completed"),M=t=>{const s=Me(t);return s==="—"?"Date invalide":s},Z=t=>{const s=ze(t);return s==="—"?"Date invalide":s},f=t=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(t),ee=t=>{if(t.reservationDate){const s=M(t.reservationDate);return t.reservationTime?`${s} ${t.reservationTime}`:s}return M(t.createdAt)},te=t=>{if(t.reservationTime)return t.reservationTime;if(t.createdAt)try{const s=new Date(t.createdAt);if(!isNaN(s.getTime()))return Ue(s)}catch{}return"Heure non spécifiée"},Ne=t=>{pe(t),j(!0),i(null)},se=t=>{G(t),A(!0)},we=()=>{A(!1),G(null)},z=R==="admin"||R==="manager",U=R==="admin",ae=async t=>{if(t.status==="cancelled"){i("Impossible de modifier une réservation annulée");return}if(t.status==="completed"&&R!=="admin"){i("Seul l'administrateur peut modifier une réservation complétée");return}K(t),c({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",notes:t.notes||"",reservationDate:t.reservationDate||"",reservationTime:t.reservationTime||""}),W(!0),i(null),x.length===0&&await D()},F=()=>{W(!1),K(null),c({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),i(null)},L=(t,s)=>{if(s<1)return;const a=[...l.items],r=x.find(o=>o._id===a[t].productId);if(r&&s>r.stock+a[t].quantity){i(`Stock insuffisant. Disponible: ${r.stock}`);return}a[t].quantity=s,a[t].total=s*a[t].price,c(o=>({...o,items:a})),i(null)},Ce=(t,s)=>{if(s<0)return;const a=[...l.items];a[t].price=s,a[t].enteredPrice=s,a[t].enteredCurrency="USD",a[t].priceUSD=s,a[t].priceFC=void 0,a[t].exchangeRate=void 0,a[t].total=s*a[t].quantity,c(r=>({...r,items:a}))},ke=t=>{const s=l.items.filter((a,r)=>r!==t);c(a=>({...a,items:s}))},Se=()=>{if(x.length===0){i("Aucun produit disponible. Veuillez actualiser les produits d'abord.");return}const t=x[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,_id:`temp-${Date.now()}`,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price};c(a=>({...a,items:[...a.items,s]}))},Re=(t,s)=>{const a=x.find(o=>o._id===s);if(!a){i("Produit sélectionné non trouvé");return}const r=[...l.items];r[t].productId=s,r[t].name=a.name,r[t].price=a.price,r[t].enteredPrice=a.price,r[t].enteredCurrency="USD",r[t].priceUSD=a.price,r[t].priceFC=void 0,r[t].exchangeRate=void 0,r[t].total=a.price*r[t].quantity,c(o=>({...o,items:r})),i(null)},re=()=>{const t=l.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},Te=async()=>{if(y){if(l.items.length===0){i("La réservation doit contenir au moins un article");return}if(!l.customer.name||!l.customer.phone){i("Le nom et le téléphone du client sont requis");return}if(!l.reason){i("Veuillez fournir une raison pour la modification de cette réservation");return}try{u(!0);const{subtotal:t,total:s}=re(),a={customer:l.customer,items:l.items.map(o=>({productId:o.productId,name:o.name,quantity:o.quantity,price:o.price,total:o.total,enteredPrice:o.enteredPrice,enteredCurrency:o.enteredCurrency,priceUSD:o.priceUSD,priceFC:o.priceFC,exchangeRate:o.exchangeRate})),subtotal:t,total:s,paymentMethod:l.paymentMethod,reason:l.reason,notes:l.notes,reservationDate:l.reservationDate,reservationTime:l.reservationTime,_id:y._id,saleId:y.saleId};console.log("Sending reservation update data:",a);const r=await fetch(`${N}/sales/${y._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify(a)});if(console.log("Update response status:",r.status),r.ok){const o=await r.json();console.log("Updated reservation:",o),C("✅ Réservation mise à jour avec succès"),await E(),F(),j(!1)}else{const o=await r.json();console.error("Update error:",o),i(o.error||`Échec de la mise à jour de la réservation: ${r.status} ${r.statusText}`)}}catch(t){console.error("Error updating reservation:",t),i("Échec de la mise à jour de la réservation. Veuillez vérifier votre connexion.")}finally{u(!1)}}},oe=async t=>{if(!U){i("Seul l'administrateur peut supprimer une réservation");return}if(window.confirm(`Êtes-vous sûr de vouloir supprimer la réservation ${t.saleId} ? Cette action est irréversible.`))try{u(!0);const s=await fetch(`${N}/sales/${t._id}`,{method:"DELETE",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(s.ok)C("✅ Réservation supprimée avec succès"),await E(),j(!1);else{const a=await s.json();i(a.error||"Échec de la suppression de la réservation")}}catch(s){i("Échec de la suppression de la réservation"),console.error("Error deleting reservation:",s)}finally{u(!1)}},{subtotal:Ee,total:Ae}=re(),q=t=>{const s=window.open("","_blank","width=320,height=600");if(s){const a=localStorage.getItem("username")||"VENDEUR",r=Fe(),o=t.status==="completed";s.document.write(`
<html>
  <head>
    <title>Reçu Réservation</title>
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
      .status-badge {
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
        ${o?"background-color: #28a745; color: white;":"background-color: #ffc107; color: #000;"}
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
      .status-info {
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
        ${o?"background-color: #d4edda; border: 2px solid #28a745;":"background-color: #fff3cd; border: 2px solid #ffc107;"}
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
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS. DIEU MERCI</strong></div>
        <div class="shop-details"><strong>Av Manono Coin Munama N°39, C. Kenya, Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 977 771 421 / +243 853 549 102</strong></div>
        <div class="shop-details"><strong>RCCM: 14-A-017885</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="status-badge">
        <strong>${o?"✅ RÉSERVATION RÉCUPÉRÉE ✅":"⏳ RÉSERVATION EN ATTENTE ⏳"}</strong>
      </div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${r}</strong></div>
        <div class="shop-details">RESERVATION #: <strong>${t.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${t.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${t.customer.phone}</strong></div>
        ${t.customer.email?`
          <div class="customer-field">EMAIL: <strong>${t.customer.email}</strong></div>
        `:""}
      </div>
      
      ${t.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${t.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${t.items.map(m=>`
        <div class="item-row">
          <div class="item-name"><strong>${m.name}</strong></div>
          <div class="item-details">
            <strong>${m.quantity}Pcs × ${m.enteredCurrency==="FC"&&m.enteredPrice!==void 0?`${m.enteredPrice.toLocaleString("fr-FR")} FC`:`$${(m.enteredPrice??m.price).toFixed(2)}`}</strong>
          </div>
        </div>
        <div class="item-row">
          <div class="item-name"><strong>Sous-total</strong></div>
          <div class="item-details">
            <strong>${m.enteredCurrency==="FC"&&m.enteredPrice!==void 0?`${(m.enteredPrice*m.quantity).toLocaleString("fr-FR")} FC<br/>Équiv. USD: $${((m.priceUSD??m.price)*m.quantity).toFixed(2)}`:`$${m.total.toFixed(2)}`}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>MONTANT TOTAL:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>ACOMPTE PERÇU:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${t.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="status-info">
        <div><strong>${o?"RÉSERVATION COMPLÉTÉE AVEC SUCCÈS":"RÉSERVATION EN ATTENTE DE RETRAIT"}</strong></div>
        <div><strong>${o?"Tous les articles ont été remis au client":"Présentez ce reçu pour retirer vos articles"}</strong></div>
        <div><strong>${o?`Date retrait: ${r}`:`Date réservation: ${ee(t)}`}</strong></div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${a.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${o?"RETRAIT EFFECTUÉ AVEC SUCCÈS !":"MERCI POUR VOTRE RÉSERVATION !"}</strong></div>
        ${o?"":`
          <div class="warning"><strong>Validité: 7 jours</strong></div>
          <div class="warning"><strong>Non remboursable</strong></div>
        `}
        <div class="warning"><strong>À BIENTÔT !</strong></div>
      </div>

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
`),s.document.close()}},Ie=async t=>{try{u(!0);const s=await fetch(`${N}/sales/${t._id}/complete`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({completedBy:localStorage.getItem("username")||"Admin"})});if(s.ok)await s.json(),C("✅ Réservation marquée comme complétée avec succès"),v(a=>a.map(r=>r._id===t._id?{...r,status:"completed",completedBy:localStorage.getItem("username")||"Admin",completedAt:new Date().toISOString()}:r)),A(!1),setTimeout(()=>{q({...t,status:"completed",completedBy:localStorage.getItem("username")||"Admin",completedAt:new Date().toISOString()})},500);else{const a=await s.json();i(a.error||"Échec de la mise à jour de la réservation")}}catch(s){i("Erreur de connexion lors de la mise à jour"),console.error("Error completing reservation:",s)}finally{u(!1)}},ne=async t=>{const s=`Êtes-vous sûr de vouloir remettre la réservation ${t.saleId} en attente ?

Cette action ne pourra pas être annulée.`;if(window.confirm(s))try{u(!0);const a=await fetch(`${N}/sales/${t._id}/pending`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(a.ok)await a.json(),C("✅ Réservation remise en attente avec succès"),v(r=>r.map(o=>o._id===t._id?{...o,status:"pending",completedBy:void 0,completedAt:void 0}:o)),j(!1);else{const r=await a.json();i(r.error||"Échec de la mise à jour de la réservation")}}catch(a){i("Erreur de connexion lors de la mise à jour"),console.error("Error setting reservation to pending:",a)}finally{u(!1)}};return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Gestion des Réservations"}),e.jsx("p",{className:"text-gray-600",children:"Gérez et suivez l'état des réservations des clients"})]}),e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsx("div",{className:"bg-blue-50 px-4 py-2 rounded-lg border border-blue-200",children:e.jsxs("div",{className:"text-sm text-blue-600 font-medium",children:["En attente: ",e.jsx("span",{className:"font-bold",children:k?.pending??X.length})]})}),e.jsx("div",{className:"bg-green-50 px-4 py-2 rounded-lg border border-green-200",children:e.jsxs("div",{className:"text-sm text-green-600 font-medium",children:["Complétées: ",e.jsx("span",{className:"font-bold",children:Y.length})]})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-blue-600",children:k?.totalReservations??w.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"Total Réservations"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-orange-600",children:k?.pending??X.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"En Attente"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-green-600",children:k?.completed??Y.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"Complétées"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-purple-600",children:k?.itemQuantity??w.reduce((t,s)=>t+s.items.reduce((a,r)=>a+r.quantity,0),0)}),e.jsx("div",{className:"text-sm text-gray-600",children:"Articles Réservés"})]})]}),H&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[H,e.jsx("button",{onClick:()=>C(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),S&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[S,e.jsx("button",{onClick:()=>i(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow",children:e.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[e.jsxs("div",{className:"relative flex-1 min-w-0 w-full sm:min-w-[300px]",children:[e.jsx(Le,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Rechercher par ID, client, téléphone...",className:"pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:g,onChange:t=>xe(t.target.value)})]}),e.jsxs("select",{value:h,onChange:t=>fe(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"all",children:"Toutes les réservations"}),e.jsx("option",{value:"pending",children:"En attente seulement"}),e.jsx("option",{value:"completed",children:"Complétées seulement"})]}),e.jsx("div",{className:"flex gap-2",children:e.jsxs("button",{onClick:E,disabled:p,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50",children:[e.jsx(_,{className:"w-4 h-4"}),p?"Chargement...":"Actualiser"]})})]})}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(le,{className:"w-5 h-5"}),"Liste des Réservations (",P.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:p?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des réservations..."})]}):P.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(le,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucune réservation trouvée"}),e.jsx("p",{className:"text-sm",children:"Aucune réservation ne correspond à vos critères de recherche"})]}):e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"ID Réservation"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date Réservation"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Montant"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:P.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsx("div",{className:"text-sm text-gray-900 font-medium",children:t.customer.name}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[e.jsx("div",{children:ee(t)}),e.jsx("div",{className:"text-gray-500 text-xs",children:te(t)})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," article(s)"]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:f(t.total)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:t.status==="completed"?"Complétée":"En Attente"})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>Ne(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails",children:e.jsx(De,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>q(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Imprimer le reçu",children:e.jsx(de,{className:"w-4 h-4"})}),z&&e.jsx("button",{onClick:()=>ae(t),disabled:t.status==="cancelled",className:`p-1 rounded ${t.status==="cancelled"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Modifier la réservation",children:e.jsx(O,{className:"w-4 h-4"})}),U&&e.jsx("button",{onClick:()=>oe(t),className:"text-red-600 hover:text-red-900 p-1 rounded",title:"Supprimer la réservation",children:e.jsx(V,{className:"w-4 h-4"})}),z&&e.jsx(e.Fragment,{children:t.status!=="completed"?e.jsx("button",{onClick:()=>se(t),disabled:p,className:"text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50",title:"Marquer comme complétée",children:e.jsx(B,{className:"w-4 h-4"})}):e.jsx("button",{onClick:()=>ne(t),disabled:p,className:"text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50",title:"Remettre en attente",children:e.jsx(ce,{className:"w-4 h-4"})})})]})})]},t._id))})]})})]}),b&&b.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",b.page," sur ",b.totalPages," · ",b.totalRecords," résultats"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!b.hasPreviousPage,onClick:()=>$(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!b.hasNextPage,onClick:()=>$(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),he&&I&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-md w-full mx-4",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Confirmer la complétion"})}),e.jsxs("div",{className:"p-6",children:[e.jsxs("p",{className:"text-gray-700 mb-4",children:["Êtes-vous sûr de vouloir marquer la réservation ",e.jsx("strong",{children:I.saleId})," comme complétée ? Un reçu de retrait sera imprimé."]}),e.jsxs("div",{className:"flex gap-3 justify-end",children:[e.jsx("button",{onClick:we,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"}),e.jsxs("button",{onClick:()=>Ie(I),disabled:p,className:"px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50",children:[e.jsx(B,{className:"w-4 h-4"}),p?"Traitement...":"Confirmer et Imprimer"]})]})]})]})}),ge&&n&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails de la Réservation - ",n.saleId]}),e.jsx("button",{onClick:()=>j(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"ID Réservation"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.saleId})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Création"}),e.jsx("p",{className:"text-sm text-gray-900",children:Z(n.createdAt)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Réservation"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.reservationDate?`${M(n.reservationDate)} à ${n.reservationTime||te(n)}`:"Non spécifiée"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de Paiement"}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:n.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${n.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:n.status==="completed"?"Complétée":"En Attente"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Vendeur"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.salesPerson||"Non spécifié"})]}),n.completedAt&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Complétée le"}),e.jsx("p",{className:"text-sm text-gray-900",children:Z(n.completedAt)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Complétée par"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.completedBy||"Inconnu"})]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(ie,{className:"w-4 h-4"}),"Informations du Client"]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ie,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.name})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(qe,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Téléphone"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.phone})]})]}),n.customer.email&&e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(_e,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.email})]})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Pe,{className:"w-4 h-4"}),"Articles Réservés (",n.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:n.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Quantité: ",t.quantity," × ",f(t.price)]})]}),e.jsx("div",{className:"text-right",children:e.jsx("p",{className:"font-medium text-gray-900",children:f(t.total)})})]})},s))})]}),n.notes&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Notes"}),e.jsx("div",{className:"bg-yellow-50 rounded-lg p-4 border border-yellow-200",children:e.jsx("p",{className:"text-sm text-gray-700",children:n.notes})})]}),e.jsx("div",{className:"border-t border-gray-200 pt-4",children:e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Montant Total:"}),e.jsx("span",{className:"text-gray-900",children:f(n.total)})]})}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsxs("button",{onClick:()=>q(n),className:"px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(de,{className:"w-4 h-4"}),"Imprimer le Reçu"]}),z&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>ae(n),disabled:n.status==="cancelled",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${n.status==="cancelled"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(O,{className:"w-4 h-4"}),"Modifier la Réservation"]}),n.status!=="completed"?e.jsxs("button",{onClick:()=>se(n),className:"flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(B,{className:"w-4 h-4"}),"Marquer comme Complétée"]}):e.jsxs("button",{onClick:()=>ne(n),className:"flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(ce,{className:"w-4 h-4"}),"Remettre en Attente"]})]}),U&&e.jsxs("button",{onClick:()=>oe(n),className:"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(V,{className:"w-4 h-4"}),"Supprimer"]}),e.jsx("button",{onClick:()=>j(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),ye&&y&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Modifier la Réservation - ",y.saleId]}),e.jsx("button",{onClick:F,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[S&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:S}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Informations du Client"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{type:"text",value:l.customer.name,onChange:t=>c(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone"}),e.jsx("input",{type:"tel",value:l.customer.phone,onChange:t=>c(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{type:"email",value:l.customer.email,onChange:t=>c(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Réservation"}),e.jsx("input",{type:"date",value:l.reservationDate,onChange:t=>c(s=>({...s,reservationDate:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Heure de Réservation"}),e.jsx("input",{type:"time",value:l.reservationTime,onChange:t=>c(s=>({...s,reservationTime:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de Paiement"}),e.jsxs("select",{value:l.paymentMethod,onChange:t=>c(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Cash"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"transfer",children:"Virement"}),e.jsx("option",{value:"other",children:"Autre"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Notes"}),e.jsx("textarea",{value:l.notes,onChange:t=>c(s=>({...s,notes:t.target.value})),placeholder:"Notes supplémentaires...",className:"w-full p-2 border rounded h-20"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:D,disabled:T,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(_,{className:`w-3 h-3 ${T?"animate-spin":""}`})," ","Actualiser Produits"]}),e.jsxs("button",{onClick:Se,disabled:x.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(me,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),x.length===0&&!T&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:l.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),T?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Chargement des produits..."}):x.length===0?e.jsx("input",{type:"text",value:t.name,onChange:a=>{const r=[...l.items];r[s].name=a.target.value,c(o=>({...o,items:r}))},placeholder:"Nom du produit",className:"w-full p-2 border rounded"}):e.jsx("select",{value:t.productId,onChange:a=>Re(s,a.target.value),className:"w-full p-2 border rounded",children:x.map(a=>e.jsxs("option",{value:a._id,children:[a.name," -"," ",f(a.price)," (Stock:"," ",a.stock,")"]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>Ce(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Quantité"}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>L(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(Oe,{className:"w-3 h-3"})}),e.jsx("input",{type:"number",min:"1",value:t.quantity,onChange:a=>L(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>L(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(me,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:f(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>ke(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(V,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:f(Ee)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:f(Ae)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de la modification"}),e.jsx("textarea",{value:l.reason,onChange:t=>c(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette réservation...",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx("button",{onClick:Te,disabled:p||l.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:p?e.jsxs(e.Fragment,{children:[e.jsx(_,{className:"w-4 h-4 animate-spin"})," Mise à jour..."]}):e.jsxs(e.Fragment,{children:[e.jsx(O,{className:"w-4 h-4"})," Mettre à jour la réservation"]})}),e.jsx("button",{onClick:F,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"})]})]})]})})]})}export{tt as default};
