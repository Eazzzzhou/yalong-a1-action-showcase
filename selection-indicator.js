import * as T from 'three';
export function selectionIndicator(scene,getMeshes,getCamera){
 const host=document.querySelector('#viewport');
 const label=document.createElement('div');label.className='selection-callout';host.append(label);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('selection-leader');
 const line=document.createElementNS(ns,'path'),dot=document.createElementNS(ns,'circle');dot.setAttribute('r','4');svg.append(line,dot);host.append(svg);
 const anchor=new T.Vector3(),localAnchor=new T.Vector3();let anchorMesh=null,signature='',valid=false;
 return {update(){
  const select=document.querySelector('#target'),meshes=getMeshes(),next=select.value+'|'+meshes.map(m=>m.uuid).join(',');
  if(next!==signature){signature=next;valid=!!select.value&&meshes.length>0&&!['sphere','box'].includes(document.querySelector('#model').value);
   if(valid){let largest=-1;for(const mesh of meshes){mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld),size=box.getSize(new T.Vector3());const score=size.x*size.y+size.y*size.z+size.x*size.z;if(score>largest){largest=score;anchorMesh=mesh;mesh.geometry.boundingBox.getCenter(localAnchor);}}label.textContent=select.selectedOptions[0]?.textContent||'选中部位';}
  }
  if(valid&&anchorMesh){anchorMesh.updateWorldMatrix(true,false);anchor.copy(localAnchor).applyMatrix4(anchorMesh.matrixWorld);}
  const p=anchor.clone().project(getCamera()),visible=valid&&p.z>-1&&p.z<1;label.hidden=svg.hidden=!visible;svg.style.display=visible?'block':'none';if(!visible)return;
  const w=host.clientWidth,h=host.clientHeight,x=(p.x+1)*w/2,y=(1-p.y)*h/2;
  const left=x>w/2?24:Math.max(24,w-260),top=76;label.style.left=left+'px';label.style.top=top+'px';
  const rect=label.getBoundingClientRect(),sx=left+(x>w/2?rect.width:0),sy=top+rect.height/2;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);line.setAttribute('d',`M ${sx} ${sy} L ${sx+(x>w/2?24:-24)} ${sy} L ${x} ${y}`);dot.setAttribute('cx',x);dot.setAttribute('cy',y);
 }};
}
