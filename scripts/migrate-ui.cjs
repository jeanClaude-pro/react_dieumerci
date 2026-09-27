// One-time syntax-aware presentation migration. Never touches HTML print strings.
const ts=require('typescript'),fs=require('node:fs'),path=require('node:path');
const files=fs.readdirSync('src/pages',{recursive:true}).filter(x=>x.endsWith('.tsx')&&!/pos[\\/]|Welcome/.test(x)).map(x=>path.join('src/pages',x));
files.push('src/components/ReceiptScannerPage.tsx');
for(const file of files){
 let source=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX), edits=[],imports=new Set();
 const add=(at,text)=>edits.push({start:at,end:at,text});
 const replace=(node,text)=>edits.push({start:node.getStart(ast),end:node.end,text});
 const attr=(open,name)=>open.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)===name);
 const literal=(open,name)=>{const a=attr(open,name);return a&&a.initializer&&ts.isStringLiteral(a.initializer)?a.initializer.text:'';};
 function descendants(n,predicate){const result=[];function walk(x){if(predicate(x))result.push(x);ts.forEachChild(x,walk);}walk(n);return result;}
 const jsxText=n=>descendants(n,ts.isJsxText).map(x=>x.text.trim()).filter(Boolean).join(' ').replace(/\s+/g,' ');
 const openOf=n=>n.openingElement||n;
 const tagOf=n=>(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n))?openOf(n).tagName.getText(ast):'';
 function visit(n){
  if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
   const open=openOf(n),tag=tagOf(n),classes=literal(open,'className');
   if(tag==='table'){
    replace(open.tagName,'ResponsiveTable');replace(n.closingElement.tagName,'ResponsiveTable');imports.add('ResponsiveTable');
   }
   if(tag==='div'&&classes.includes('fixed')&&classes.includes('inset-0')){
    const buttons=descendants(n,x=>tagOf(x)==='button');
    const close=buttons.find(b=>{const a=attr(openOf(b),'onClick');return a&&/setShow\w*\(false\)|close\w*Modal/.test(a.getText(ast));});
    const title=descendants(n,x=>/^h[123]$/.test(tagOf(x)))[0];
    if(close){
     replace(open.tagName,'Dialog');replace(n.closingElement.tagName,'Dialog');
     replace(attr(open,'className'),`label=${JSON.stringify(title?jsxText(title):'Détails')} onClose=${attr(openOf(close),'onClick').initializer.getText(ast)}`);
     imports.add('Dialog');
    }
   }
   if(['input','select','textarea'].includes(tag)&&!attr(open,'aria-label')&&!attr(open,'aria-labelledby')){
    let container=n.parent,label;
    for(let depth=0;container&&depth<4;depth++,container=container.parent){
     if(ts.isJsxElement(container)&&tagOf(container)==='label'){label=container;break;}
     if(ts.isJsxElement(container)){
      const labels=descendants(container,x=>tagOf(x)==='label');
      if(labels.length===1){label=labels[0];break;}
      if(labels.length>1)break;
     }
    }
    const name=(label?jsxText(label):'')||literal(open,'placeholder')||literal(open,'name');
    if(name&&!(label&&tagOf(n.parent)==='label')){
     add(open.tagName.end,` aria-label=${JSON.stringify(name)}`);
     // Associate visible labels when there is one unambiguous field and no loop.
     const existingId=literal(open,'id');
     let ancestor=n,loop=false;while(ancestor){if(ts.isCallExpression(ancestor)&&/\.map$/.test(ancestor.expression.getText(ast)))loop=true;ancestor=ancestor.parent;}
     if(label&&!attr(label.openingElement,'htmlFor')&&!loop&&descendants(container,x=>['input','select','textarea'].includes(tagOf(x))).length===1){
      const id=existingId||`${path.basename(file,'.tsx').toLowerCase()}-field-${n.getStart(ast)}`;
      if(!existingId)add(open.tagName.end,` id=${JSON.stringify(id)}`);
      add(label.openingElement.tagName.end,` htmlFor=${JSON.stringify(id)}`);
     }
    }
   }
   if(tag==='button'&&!attr(open,'aria-label')){
    const title=attr(open,'title');
    const txt=jsxText(n);
    if(title)add(open.tagName.end,` aria-label=${title.initializer.getText(ast)}`);
    else if(!txt||txt==='×'){
     const names=descendants(n,x=>ts.isJsxSelfClosingElement(x)).map(x=>tagOf(x));
     const iconLabels={X:'Fermer',Eye:'Voir les détails',EyeOff:'Masquer le mot de passe',Trash2:'Supprimer',Edit:'Modifier',Edit3:'Modifier',ChevronLeft:'Précédent',ChevronRight:'Suivant',RefreshCw:'Actualiser',Printer:'Imprimer',Download:'Télécharger',Plus:'Ajouter',Minus:'Diminuer',ToggleLeft:'Activer',ToggleRight:'Désactiver'};
     const name=txt==='×'?'Fermer':names.map(x=>iconLabels[x]).find(Boolean);
     if(name)add(open.tagName.end,` aria-label=${JSON.stringify(name)}`);
    }
   }
   if(classes.includes('min-w-[280px]')){
    const a=attr(open,'className');replace(a.initializer,JSON.stringify(classes.replace('min-w-[280px]','min-w-0 w-full sm:w-auto sm:min-w-[280px]')));
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(ast);
 edits.sort((a,b)=>b.start-a.start).forEach(e=>{source=source.slice(0,e.start)+e.text+source.slice(e.end);});
 let relative=path.relative(path.dirname(file),'src/components/ui').replaceAll('\\','/');if(!relative.startsWith('.'))relative='./'+relative;
 if(imports.size)source=[...imports].map(name=>`import ${name} from "${relative}/${name}";`).join('\n')+'\n'+source;
 fs.writeFileSync(file,source);
 console.log(file,edits.length,'presentation edits', [...imports].join(', '));
}
