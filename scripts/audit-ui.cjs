const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const files = fs.readdirSync('src', {recursive:true}).filter(x=>x.endsWith('.tsx'));
const inventory=[];
for(const file of files){
 const source=fs.readFileSync(path.join('src',file),'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const result={file, controls:[],tables:[],dialogs:[],handlers:[],states:[]};
 function visit(n){
  if(ts.isVariableDeclaration(n)&&n.initializer&&/^use(State|Reducer)/.test(n.initializer.getText(ast))) result.states.push(n.getText(ast));
  if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
   const open=n.openingElement||n;const tag=open.tagName.getText(ast);
   const attrs=Object.fromEntries(open.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(ast),a.initializer?.getText(ast)]));
   const line=ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1;
   if(['input','select','textarea','button','label','h1','h2','h3'].includes(tag))result.controls.push({line,tag,attrs,text:n.children?.filter(ts.isJsxText).map(x=>x.text.trim()).join(' ')});
   if(tag==='table')result.tables.push({line,source:n.getText(ast)});
   if(attrs.className?.includes('fixed inset-0'))result.dialogs.push({line,source:n.getText(ast)});
   if(attrs.onClick||attrs.onSubmit||attrs.onChange)result.handlers.push({line,tag,onClick:attrs.onClick,onSubmit:attrs.onSubmit,onChange:attrs.onChange});
  }
  ts.forEachChild(n,visit);
 }
 visit(ast);inventory.push(result);
 console.log(file,JSON.stringify({controls:result.controls.length,tables:result.tables.length,dialogs:result.dialogs.map(d=>({line:d.line,close:d.source.match(/onClick=\{([^]*?)\}\s+className/)?.[1]?.slice(0,140)}))}));
}
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ui-inventory.json',JSON.stringify(inventory,null,2));
