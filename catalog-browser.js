const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bytes=n=>n>=1e9?(n/1e9).toFixed(2)+' GB':(n/1e6).toFixed(1)+' MB';
export class CatalogBrowser {
 constructor(options){
  Object.assign(this,options);this.page=0;this.pageSize=24;this.picked=new Set();this.meta={};this.syncTimer=null;
  $('#search').oninput=()=>this.reset();$('#category-filter').onchange=()=>this.reset();$('#cache-filter').onchange=()=>this.reset();$('#resolution').onchange=()=>this.reset();
  $('#prev-page').onclick=()=>{this.page--;this.render();$('#asset-grid').scrollTop=0;};$('#next-page').onclick=()=>{this.page++;this.render();$('#asset-grid').scrollTop=0;};
  $('#pick-page').onclick=()=>{this.currentPage().forEach(a=>a.remote&&this.picked.add(a.id));this.render();};$('#clear-picks').onclick=()=>{this.picked.clear();this.render();};
  $('#sync-catalog').onclick=()=>this.sync();$('#open-downloads').onclick=()=>{this.estimate();$('#downloads-dialog').showModal();this.pollQueue();};$('#close-downloads').onclick=()=>$('#downloads-dialog').close();
  $('#batch-scope').onchange=()=>this.estimate();$('#batch-resolution').onchange=()=>this.estimate();
  $('#start-batch').onclick=()=>this.startBatch();
  for(const action of ['pause','resume','clear'])$('#'+action+'-queue').onclick=async()=>{try{await this.request('/api/queue/'+action,{});await this.pollQueue();}catch(e){this.notify(e.message);}};
  this.queueTimer=setInterval(()=>{if($('#page-materials').classList.contains('active')||$('#downloads-dialog').open)this.pollQueue();},2500);
 }
 async request(url,data){const response=await fetch(url,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'请求失败');return result;}
 async load(){
  try{this.meta=await this.request('/api/catalog');this.onCatalog(this.meta.assets);}
  catch(e){const response=await fetch('catalog.json');this.meta={errors:{server:'完整目录服务未连接；当前显示原有样本。请使用启动脚本重启服务。'}};this.onCatalog(await response.json());}
  this.refreshCategories();this.onLibraries();this.render();this.pollQueue();
  const counts=this.getCatalog().filter(a=>a.remote).length;const errors=Object.values(this.meta.errors||{});
  $('#catalog-status').textContent=(counts?'已索引 '+counts.toLocaleString()+' 套远程材质':'当前为离线样本')+(errors.length?' · '+errors.join('；'):' · 目录已保存到本机');
  if(this.meta.syncing){$('#catalog-status').textContent+=' · 同步中…';clearTimeout(this.syncTimer);this.syncTimer=setTimeout(()=>this.load(),1800);}
  return this.getCatalog();
 }
 async sync(){const b=$('#sync-catalog');b.disabled=true;$('#catalog-status').textContent='正在同步两个官方目录…';try{await this.request('/api/sync',{});await new Promise(r=>setTimeout(r,500));await this.load();this.notify('目录同步已启动，不会下载整库 PBR。');}catch(e){this.notify(e.message);}finally{b.disabled=false;}}
 refreshCategories(){const current=$('#category-filter').value;const categories=[...new Set(this.getCatalog().filter(a=>a.library===this.getLibrary()).map(a=>a.category))].sort();$('#category-filter').innerHTML='<option value="">全部分类</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('#category-filter').value=categories.includes(current)?current:'';}
 switchLibrary(){this.page=0;$('#category-filter').value='';this.refreshCategories();this.render();}
 reset(){this.page=0;this.render();}
 filtered(){const q=$('#search').value.trim().toLowerCase(),cat=$('#category-filter').value,cache=$('#cache-filter').value,res=$('#resolution').value;return this.getCatalog().filter(a=>a.library===this.getLibrary()&&(!cat||a.category===cat)&&(!q||[a.title,a.asset,a.category,...(a.tags||[])].join(' ').toLowerCase().includes(q))&&(!cache||(cache==='cached'?this.isCached(a,res):!this.isCached(a,res))));}
 isCached(a,res){return !a.remote||a.cachedResolutions?.includes(res);}
 currentPage(){return this.filtered().slice(this.page*this.pageSize,(this.page+1)*this.pageSize);}
 render(){const filtered=this.filtered(),pages=Math.max(1,Math.ceil(filtered.length/this.pageSize));this.page=Math.max(0,Math.min(this.page,pages-1));const res=$('#resolution').value;$('#asset-count').textContent=filtered.length.toLocaleString()+' 套';$('#page-info').textContent=(this.page+1)+' / '+pages;$('#prev-page').disabled=this.page===0;$('#next-page').disabled=this.page===pages-1;$('#picked-count').textContent='已勾选 '+this.picked.size+' 套';
  const assets=this.currentPage();$('#asset-grid').innerHTML=assets.length?assets.map(a=>`<div class="asset-tile"><button class="asset-card ${this.getSelected()?.id===a.id?'active':''}" data-asset="${esc(a.id)}" title="${esc(a.title)}"><img src="${esc(a.thumbnail||a.maps?.color||a.maps?.rough||'')}" alt="${esc(a.title)}" loading="lazy"><b>${esc(a.title)}</b><small>${esc(a.asset)}</small><span class="cache-badge ${this.isCached(a,res)?'cached':''}">${this.isCached(a,res)?'已缓存':'点击下载'} · ${a.remote?res.toUpperCase():'现有'}</span></button>${a.remote?`<input class="asset-check" type="checkbox" data-pick="${esc(a.id)}" aria-label="勾选 ${esc(a.title)}" ${this.picked.has(a.id)?'checked':''}>`:''}</div>`).join(''):'<div class="no-assets">没有匹配的可替换素材。此来源若尚未接入，可从左侧官方目录继续浏览。</div>';
  document.querySelectorAll('[data-asset]').forEach(b=>b.onclick=()=>this.onSelect(this.getCatalog().find(a=>a.id===b.dataset.asset)));document.querySelectorAll('[data-pick]').forEach(b=>b.onchange=()=>{b.checked?this.picked.add(b.dataset.pick):this.picked.delete(b.dataset.pick);$('#picked-count').textContent='已勾选 '+this.picked.size+' 套';});
  document.querySelectorAll('#asset-grid img').forEach(image=>image.onerror=()=>{image.removeAttribute('src');image.alt='预览未加载 · 可点击下载材质';image.classList.add('image-failed');});
 }
 async ensure(asset,resolution=$('#resolution').value){
  if(!asset.remote)return asset;
  const resolved=await this.request('/api/material',{id:asset.id,resolution});
  const target=this.getCatalog().find(a=>a.id===asset.id);if(target){target.cachedResolutions=[...new Set([...(target.cachedResolutions||[]),resolution])];}
  this.render();this.pollQueue();return resolved;
 }
 batchAssets(){const scope=$('#batch-scope').value,res=$('#batch-resolution').value;const assets=scope==='picked'?this.getCatalog().filter(a=>this.picked.has(a.id)):scope==='page'?this.currentPage():this.filtered();return assets.filter(a=>a.remote&&a.resolutions?.includes(res));}
 estimate(){const assets=this.batchAssets(),res=$('#batch-resolution').value,pending=assets.filter(a=>!this.isCached(a,res));const known=pending.reduce((s,a)=>s+(a.downloadSizes?.[res]||0),0),unknown=pending.filter(a=>!a.downloadSizes?.[res]).length;$('#batch-estimate').innerHTML=`<b>${assets.length.toLocaleString()} 套 · ${res.toUpperCase()}</b><p>已缓存 ${assets.length-pending.length} 套；需要下载 ${pending.length} 套。<br>${known?'已知原始下载包合计 '+bytes(known)+'；':''}${unknown?unknown+' 套需获取通道清单后才能确定体积。':''}<br>解压后的通道及原始包会另占空间；这不是最终磁盘占用。</p>`;$('#start-batch').disabled=!assets.length;}
 async startBatch(){const b=$('#start-batch'),assets=this.batchAssets();b.disabled=true;try{await this.request('/api/queue',{ids:assets.map(a=>a.id),resolution:$('#batch-resolution').value});this.notify('已加入下载队列；可暂停后续任务。');await this.pollQueue();}catch(e){this.notify(e.message);}finally{b.disabled=false;}}
 async pollQueue(){if(this.polling)return;this.polling=true;try{const q=await this.request('/api/queue');$('#cache-status').textContent='完整 PBR 缓存 '+q.cachedCount+' 套／分辨率 · '+bytes(q.cacheBytes);$('#queue-summary').textContent=`${q.running?'下载中':'已暂停／空闲'} · 完成 ${q.done} / ${q.total} · 等待 ${q.pending} · 失败 ${q.error}`;$('#queue-current').textContent=q.current?'当前：'+q.current.title+' · '+q.current.resolution.toUpperCase():'';$('#queue-progress').max=q.total||1;$('#queue-progress').value=q.done;$('#queue-errors').innerHTML=q.errors.map(t=>`<p>${esc(t.title)}：${esc(t.error)}</p>`).join('');$('#pause-queue').disabled=!q.running;$('#resume-queue').disabled=q.running||(!q.pending&&!q.error);$('#clear-queue').disabled=q.running||!!q.current;if(this.lastDone!==undefined&&q.done!==this.lastDone){const data=await this.request('/api/catalog');this.onCatalog(data.assets);this.render();}this.lastDone=q.done;}catch{}finally{this.polling=false;}}
}
