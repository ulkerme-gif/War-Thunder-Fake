/* ÇELİK CEPHE — War Thunder tarzı birleşik muharebe (kara + hava)
   three.js r128 · M1A2 Abrams, M2A3 Bradley, A-10A / Su-25 · SP ekonomisi, Arcade/Gerçekçi modlar */
(()=>{
'use strict';
const T=THREE,$=s=>document.querySelector(s),DEG=Math.PI/180;
const coarse=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
const cl=(v,a,b)=>v<a?a:v>b?b:v,lp=(a,b,t)=>a+(b-a)*t,wr=a=>Math.atan2(Math.sin(a),Math.cos(a)),ss=t=>(t=cl(t,0,1))*t*(3-2*t);
const mkRng=s=>()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
let rnd=mkRng(4027);const V=(a,b)=>a+rnd()*(b-a),RV=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
const store={get(k,d){try{const v=localStorage.getItem('ironbound.'+k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem('ironbound.'+k,v)}catch(e){}}};

/* ---------- Kalite ---------- */
const QN=store.get('q',coarse?'low':'high'),HI=QN==='high';
const Q={hi:HI,post:HI,shadow:HI?2048:1024,seg:HI?360:220,trees:HI?900:420,bushes:HI?1500:550,rocks:HI?260:150,part:HI?1:.55,tex:HI?'':'_lq',marks:HI?3600:1600};
let PR=Math.min(devicePixelRatio||1,HI?1.75:1.3);
const glc=$('#gl'),hc=$('#hud'),hx=hc.getContext('2d');
let touchUI=coarse;document.body.classList.toggle('touch',touchUI);

/* ---------- Renderer ---------- */
const R=new T.WebGLRenderer({canvas:glc,antialias:!coarse,powerPreference:'high-performance'});
{const g=R.getContext();if(!R.capabilities.isWebGL2||!g.getExtension('EXT_color_buffer_float'))Q.post=false}
R.outputEncoding=T.sRGBEncoding;R.toneMapping=Q.post?T.NoToneMapping:T.ACESFilmicToneMapping;R.toneMappingExposure=.9;
R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;R.setPixelRatio(PR);
const scene=new T.Scene(),cam=new T.PerspectiveCamera(55,1,.35,3400);
const sunDir=new T.Vector3(-.55,.5,.67).normalize(),HOR=new T.Color(.6,.63,.64),FOGD=.00082;
scene.fog=new T.FogExp2(HOR.clone(),FOGD);
const clock={t:0};

/* ---------- Gökyüzü + ortam ışığı ---------- */
const SKYFS=`uniform vec3 sunDir,hor,zen;uniform float time,clouds;varying vec3 vD;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return s;}
void main(){vec3 d=normalize(vD);float h=max(d.y,0.);
vec3 c=mix(hor,zen,pow(h,.42));float sd=max(dot(d,sunDir),0.);
c+=vec3(1.,.8,.55)*(pow(sd,6.)*.22+pow(sd,48.)*.35)+vec3(1.,.93,.8)*smoothstep(.99935,.9997,sd)*22.;
if(clouds>.5&&d.y>0.){vec2 q=d.xz/(d.y+.1)*1.3+vec2(time*.003,time*.0016);float n=fb(q*1.6),cv=smoothstep(.47,.76,n)*smoothstep(.0,.22,d.y);
vec3 cc=mix(vec3(.78,.79,.82),vec3(1.05,.98,.9),clamp(pow(sd,3.)+fb(q*3.1+1.)*.4,0.,1.));c=mix(c,cc,cv*.82);}
c=mix(c,hor*.8+vec3(.03,.02,.0),smoothstep(0.,-.12,d.y));
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <encodings_fragment>
}`;
const skyU={sunDir:{value:sunDir},hor:{value:HOR},zen:{value:new T.Color(.12,.27,.56)},time:{value:0},clouds:{value:1}};
const sky=new T.Mesh(new T.SphereGeometry(1000,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:skyU,
vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',fragmentShader:SKYFS}));
sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
{const pm=new T.PMREMGenerator(R),es=new T.Scene();
es.add(new T.Mesh(new T.SphereGeometry(40,32,16),new T.ShaderMaterial({side:T.BackSide,toneMapped:false,uniforms:{...skyU,clouds:{value:0}},
vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:SKYFS})));
scene.environment=pm.fromScene(es,.03).texture;pm.dispose()}
const sun=new T.DirectionalLight(0xfff0d8,Q.post?3.1:2.1);sun.castShadow=true;sun.shadow.mapSize.set(Q.shadow,Q.shadow);
{const c=sun.shadow.camera;c.left=c.bottom=-62;c.right=c.top=62;c.near=1;c.far=420}
sun.shadow.bias=-.00035;sun.shadow.normalBias=.45;scene.add(sun,sun.target);
const hemi=new T.HemisphereLight(0xc6d8ff,0x7a6748,.28);scene.add(hemi);
const flash=new T.PointLight(0xffb060,0,70,2);scene.add(flash);let flashT=0;

/* ---------- Son işlem (HDR, bloom, ton eşleme, vinyet) ---------- */
const POST=Q.post?(()=>{
const mk=(ms)=>{const o={type:T.HalfFloatType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:!!ms,stencilBuffer:false};
const r=ms?new T.WebGLMultisampleRenderTarget(4,4,o):new T.WebGLRenderTarget(4,4,o);if(ms)r.samples=4;r.texture.generateMipmaps=false;return r};
const main=mk(1),b1=mk(),b2=mk(),c1=mk(),c2=mk();
const qc=new T.OrthographicCamera(-1,1,1,-1,0,1),qs=new T.Scene(),quad=new T.Mesh(new T.PlaneGeometry(2,2));quad.frustumCulled=false;qs.add(quad);
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const SM=(u,f)=>new T.ShaderMaterial({uniforms:u,vertexShader:VS,fragmentShader:f,depthTest:false,depthWrite:false});
const bright=SM({t:{value:null},px:{value:new T.Vector2()}},`uniform sampler2D t;uniform vec2 px;varying vec2 vUv;
void main(){vec3 c=(texture2D(t,vUv+px*vec2(-1.,-1.)).rgb+texture2D(t,vUv+px*vec2(1.,-1.)).rgb+texture2D(t,vUv+px*vec2(-1.,1.)).rgb+texture2D(t,vUv+px*vec2(1.,1.)).rgb)*.25;
float l=max(max(c.r,c.g),c.b);gl_FragColor=vec4(c*smoothstep(1.1,3.2,l),1.);}`);
const blur=SM({t:{value:null},dir:{value:new T.Vector2()}},`uniform sampler2D t;uniform vec2 dir;varying vec2 vUv;
void main(){vec3 c=texture2D(t,vUv).rgb*.227027;c+=(texture2D(t,vUv+dir*1.3846).rgb+texture2D(t,vUv-dir*1.3846).rgb)*.316216;
c+=(texture2D(t,vUv+dir*3.2308).rgb+texture2D(t,vUv-dir*3.2308).rgb)*.07027;gl_FragColor=vec4(c,1.);}`);
const comp=SM({t:{value:main.texture},b1:{value:b1.texture},b2:{value:c2.texture},exposure:{value:.82},sat:{value:1.04},vig:{value:.9},hurt:{value:0},time:{value:0},res:{value:new T.Vector2()},scope:{value:0}},
`uniform sampler2D t,b1,b2;uniform float exposure,sat,vig,hurt,time,scope;uniform vec2 res;varying vec2 vUv;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture2D(t,vUv).rgb;c+=texture2D(b1,vUv).rgb*.5+texture2D(b2,vUv).rgb*.75;
c=aces(c*exposure);float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,sat);
c=c*vec3(1.02,1.,.97)+vec3(.006,.004,0.);vec2 q=vUv-.5;c*=1.-dot(q,q)*vig;
c=mix(c,vec3(l)*vec3(.9,1.05,.92),scope*.12);c=mix(c,c*vec3(1.25,.45,.4),hurt);
c=pow(max(c,0.),vec3(1./2.2));c+=(hs(vUv*res+fract(time))-.5)*.016;gl_FragColor=vec4(c,1.);}`);
return{comp,size(w,h){main.setSize(w,h);const bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);b1.setSize(bw,bh);b2.setSize(bw,bh);c1.setSize(bw>>1||1,bh>>1||1);c2.setSize(bw>>1||1,bh>>1||1);comp.uniforms.res.value.set(w,h)},
render(){R.setRenderTarget(main);R.render(scene,cam);
const pass=(m,src,dst)=>{quad.material=m;m.uniforms.t.value=src.texture;R.setRenderTarget(dst);R.render(qs,qc)};
bright.uniforms.px.value.set(1/main.width,1/main.height);pass(bright,main,b1);
blur.uniforms.dir.value.set(1/b1.width,0);pass(blur,b1,b2);blur.uniforms.dir.value.set(0,1/b1.height);pass(blur,b2,b1);
blur.uniforms.dir.value.set(1/c1.width,0);pass(blur,b1,c1);blur.uniforms.dir.value.set(0,1/c1.height);pass(blur,c1,c2);
quad.material=comp;comp.uniforms.time.value=clock.t;R.setRenderTarget(null);R.render(qs,qc)}}})():null;

/* ---------- Gürültü ---------- */
const perm=new Uint8Array(512);{const r=mkRng(1337),p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=r()*(i+1)|0,t=p[i];p[i]=p[j];p[j]=t}for(let i=0;i<512;i++)perm[i]=p[i&255]}
const GX=[1,-1,1,-1,1,-1,0,0],GY=[1,1,-1,-1,0,0,1,-1];
function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),xf=x-X,yf=y-Y,xi=X&255,yi=Y&255,u=xf*xf*xf*(xf*(xf*6-15)+10),v=yf*yf*yf*(yf*(yf*6-15)+10),
a=perm[xi]+yi,b=perm[xi+1]+yi,g=(h,x,y)=>GX[h&7]*x+GY[h&7]*y;
return lp(lp(g(perm[a],xf,yf),g(perm[b],xf-1,yf),u),lp(g(perm[a+1],xf,yf-1),g(perm[b+1],xf-1,yf-1),u),v)}
function fbm(x,y,o){let s=0,a=1,f=1,n=0;for(let i=0;i<o;i++){s+=noise(x*f,y*f)*a;n+=a;a*=.5;f*=2.03}return s/n}
function pn(x,y,P,sd){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),
h=(i,j)=>{i=((i%P)+P)%P;j=((j%P)+P)%P;let n=Math.imul(i,374761393)+Math.imul(j,668265263)+Math.imul(sd,144665);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
return lp(lp(h(xi,yi),h(xi+1,yi),u),lp(h(xi,yi+1),h(xi+1,yi+1),u),v)}

/* ---------- Harita düzeni ---------- */
const W=900,N=Q.seg,NV=N+1,CS=2*W/N,BA=560;
const CAPS=[{id:'A',x:-265,z:40,r:32},{id:'B',x:12,z:-14,r:30},{id:'C',x:272,z:-48,r:32}];
const SPAWN={blue:{x:0,z:405,h:Math.PI},red:{x:-10,z:-405,h:0}};
const ROADS=[[[-20,700],[5,520],[30,400],[40,300],[28,180],[6,70],[12,-14],[-14,-120],[-42,-250],[-14,-380],[-10,-700]],
[[-700,110],[-540,95],[-400,70],[-265,40],[-130,18],[12,-14],[140,-28],[272,-48],[400,-70],[560,-95],[700,-120]],
[[272,-48],[305,110],[262,262],[130,392],[30,400]],
[[-265,40],[-300,-140],[-210,-300],[-42,-250]],
[[-265,40],[-240,240],[-120,380],[5,520]]];
const SEGS=[];ROADS.forEach(r=>{for(let i=0;i<r.length-1;i++){const[a,b]=[r[i],r[i+1]],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);SEGS.push({ax:a[0],az:a[1],dx:dx/l,dz:dz/l,l})}});
function roadInfo(x,z){let m=1e9,s0=null;for(const s of SEGS){const px=x-s.ax,pz=z-s.az,t=cl(px*s.dx+pz*s.dz,0,s.l),qx=px-s.dx*t,qz=pz-s.dz*t,d=qx*qx+qz*qz;if(d<m){m=d;s0=s}}return{d:Math.sqrt(m),s:s0}}
const roadD=(x,z)=>roadInfo(x,z).d;
const wadiZ=x=>205+48*Math.sin(x/160+.4)+22*Math.sin(x/57);
function baseH(x,z){return fbm(x/560+3.1,z/560-1.7,4)*30+fbm(x/150-4,z/150+2,3)*8
+15*Math.exp(-((x-340)**2+(z+130)**2)/(2*85*85))+19*Math.exp(-((x+390)**2+(z+230)**2)/(2*115*115))
+11*Math.exp(-((z+320)**2)/(2*55*55))*(.6+.4*Math.sin(x/90))+9*Math.exp(-((x-260)**2+(z-300)**2)/(2*90*90))}
const FLAT=[...CAPS.map(c=>({x:c.x,z:c.z,r:c.id==='B'?95:22,f:c.id==='B'?80:40,k:c.id==='B'?.85:.7})),{x:SPAWN.blue.x,z:SPAWN.blue.z,r:45,f:50,k:.8},{x:SPAWN.red.x,z:SPAWN.red.z,r:45,f:50,k:.8}];
FLAT.forEach(f=>f.h=baseH(f.x,f.z));
function rawH(x,z,rd){let b=baseH(x,z),h=b+noise(x/38,z/38)*1.3+noise(x/11+5,z/11)*.25;
const wz=wadiZ(x),wd=Math.abs(z-wz);h-=4.6*(1-ss((wd-6)/12));
for(const f of FLAT){const d=Math.hypot(x-f.x,z-f.z),w=1-ss((d-f.r)/f.f);if(w>0){h=lp(h,f.h+(h-f.h)*(1-f.k),w);b=lp(b,f.h,w)}}
const wr2=1-ss((rd-4)/6);h=lp(h,b,wr2*.8)-.22*wr2;
const e=ss((Math.max(Math.abs(x),Math.abs(z))-BA-30)/240);h+=e*(55+45*fbm(x/210,z/210,3));
return h}

/* ---------- Arazi ızgarası ---------- */
const H=new Float32Array(NV*NV),RD=new Float32Array(NV*NV);
for(let iz=0;iz<NV;iz++)for(let ix=0;ix<NV;ix++){const x=-W+ix*CS,z=-W+iz*CS,i=iz*NV+ix,rd=roadD(x,z);RD[i]=rd;H[i]=rawH(x,z,rd)}
function hAt(x,z){let fx=(x+W)/CS,fz=(z+W)/CS;fx=cl(fx,0,N-.0001);fz=cl(fz,0,N-.0001);const ix=fx|0,iz=fz|0,u=fx-ix,v=fz-iz,i=iz*NV+ix,
ha=H[i],hd=H[i+1],hb=H[i+NV],hc=H[i+NV+1];return u+v<=1?ha+(hd-ha)*u+(hb-ha)*v:hc+(hb-hc)*(1-u)+(hd-hc)*(1-v)}
function nAt(x,z,o){const e=1.5;return(o||new T.Vector3()).set(hAt(x-e,z)-hAt(x+e,z),2*e,hAt(x,z-e)-hAt(x,z+e)).normalize()}

/* ---------- Doku üretimi ---------- */
function cTex(sz,draw,lin){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d');draw(x,sz);const t=new T.CanvasTexture(c);
t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Q.hi?8:4;if(!lin)t.encoding=T.sRGBEncoding;return t}
const wrapD=(s,x,y,r,f)=>{for(const ox of[-s,0,s])for(const oy of[-s,0,s]){const a=x+ox,b=y+oy;if(a>-r&&a<s+r&&b>-r&&b<s+r)f(a,b)}};
function speck(x,s,n,cols,r0,r1,al){for(let i=0;i<n;i++){const px=rnd()*s,py=rnd()*s,r=r0+rnd()*(r1-r0);x.fillStyle=cols[rnd()*cols.length|0];x.globalAlpha=al*(.5+rnd()*.5);
wrapD(s,px,py,r,(a,b)=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()})}x.globalAlpha=1}
function noiseFill(x,s,P,sd,c0,c1,amp){const d=x.getImageData(0,0,s,s),D=d.data;for(let j=0;j<s;j++)for(let i=0;i<s;i++){let n=0,a=1,f=1,t=0;for(let o=0;o<4;o++){n+=pn(i/s*P*f,j/s*P*f,P*f,sd+o)*a;t+=a;a*=.5;f*=2}n=n/t;n=cl(.5+(n-.5)*amp,0,1);
const k=(j*s+i)*4;D[k]=lp(c0[0],c1[0],n);D[k+1]=lp(c0[1],c1[1],n);D[k+2]=lp(c0[2],c1[2],n);D[k+3]=255}x.putImageData(d,0,0)}
const texG=cTex(512,(x,s)=>{noiseFill(x,s,8,11,[98,90,52],[142,128,76],1.6);speck(x,s,260,['#5e6436','#8e7b4c','#6d6a3a'],6,26,.14);
for(let i=0;i<11000;i++){const px=rnd()*s,py=rnd()*s,l=2+rnd()*6,a=rnd()*6.28;x.strokeStyle=`hsla(${38+rnd()*36},${24+rnd()*26}%,${20+rnd()*34}%,.7)`;x.lineWidth=.7+rnd()*.9;
wrapD(s,px,py,8,(u,v)=>{x.beginPath();x.moveTo(u,v);x.lineTo(u+Math.cos(a)*l,v+Math.sin(a)*l);x.stroke()})}});
const texD=cTex(512,(x,s)=>{noiseFill(x,s,8,21,[96,76,54],[140,116,86],1.5);speck(x,s,1800,['#5a4632','#a08a68','#6e5a44','#b9a07c'],.6,2.4,.5);speck(x,s,90,['#4c3c2c'],5,18,.12)});
const texR=cTex(512,(x,s)=>{noiseFill(x,s,6,31,[86,80,74],[150,140,128],2.2);speck(x,s,700,['#5a5550','#a39a8e','#776f66'],1,4,.45);
x.strokeStyle='rgba(40,36,32,.35)';for(let i=0;i<60;i++){let px=rnd()*s,py=rnd()*s;x.lineWidth=.8+rnd();x.beginPath();x.moveTo(px,py);for(let k=0;k<6;k++){px+=V(-14,14);py+=V(-14,14);x.lineTo(px,py)}x.stroke()}});
const texS=cTex(512,(x,s)=>{noiseFill(x,s,10,41,[124,104,78],[170,150,116],1.3);speck(x,s,2600,['#8a7458','#c2aa86','#9a8466','#6c5a46'],.5,1.8,.55)});
const texN=cTex(256,(x,s)=>noiseFill(x,s,4,51,[0,0,0],[255,255,255],1.4),1);

/* ---------- Arazi örgüsü ---------- */
const terrain=(()=>{const g=new T.BufferGeometry(),n=NV*NV,P=new Float32Array(n*3),Nm=new Float32Array(n*3),C=new Float32Array(n*3),SP=new Float32Array(n*4),I=new Uint32Array(N*N*6);
const nv=new T.Vector3();
for(let iz=0;iz<NV;iz++)for(let ix=0;ix<NV;ix++){const i=iz*NV+ix,x=-W+ix*CS,z=-W+iz*CS,h=H[i];P[i*3]=x;P[i*3+1]=h;P[i*3+2]=z;
const hl=H[iz*NV+Math.max(ix-1,0)],hr=H[iz*NV+Math.min(ix+1,N)],hd=H[Math.max(iz-1,0)*NV+ix],hu=H[Math.min(iz+1,N)*NV+ix];
nv.set(hl-hr,2*CS,hd-hu).normalize();Nm[i*3]=nv.x;Nm[i*3+1]=nv.y;Nm[i*3+2]=nv.z;
const slope=1-nv.y,rd=RD[i],road=1-ss((rd-3.1)/2.4),rock=ss((slope-.075)/.07)*(1-road),
dv=Math.hypot(x-CAPS[1].x,z-CAPS[1].z),wd=Math.abs(z-wadiZ(x)),edge=ss((Math.max(Math.abs(x),Math.abs(z))-BA)/150);
let dirt=cl(ss(fbm(x/70+9,z/70,3)*2.4+.05)+(1-ss((dv-60)/70))*.55+(1-ss((wd-5)/8))*.8+edge*.3,0,1)*(1-road)*(1-rock);
const gr=Math.max(0,1-dirt-rock-road);SP[i*4]=gr;SP[i*4+1]=dirt;SP[i*4+2]=rock;SP[i*4+3]=road;
const m=fbm(x/240-7,z/240+3,3),k=.92+m*.25;C[i*3]=k*(1.02+m*.05);C[i*3+1]=k;C[i*3+2]=k*(.94-m*.06)}
for(let iz=0,k=0;iz<N;iz++)for(let ix=0;ix<N;ix++){const a=iz*NV+ix,b=a+NV,c=b+1,d=a+1;I[k++]=a;I[k++]=b;I[k++]=d;I[k++]=b;I[k++]=c;I[k++]=d}
g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('normal',new T.BufferAttribute(Nm,3));g.setAttribute('color',new T.BufferAttribute(C,3));
g.setAttribute('splat',new T.BufferAttribute(SP,4));g.setIndex(new T.BufferAttribute(I,1));g.computeBoundingSphere();
const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.97,metalness:0,envMapIntensity:.55});
m.onBeforeCompile=s=>{Object.assign(s.uniforms,{tG:{value:texG},tD:{value:texD},tR:{value:texR},tS:{value:texS},tN:{value:texN}});
s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 splat;varying vec4 vSp;varying vec3 vW;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSp=splat;vW=(modelMatrix*vec4(position,1.)).xyz;');
s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D tG,tD,tR,tS,tN;varying vec4 vSp;varying vec3 vW;
vec3 tx(sampler2D t){return mix(texture2D(t,vW.xz*.21).rgb,texture2D(t,vW.xz*.047+.37).rgb,.42);}`).replace('#include <map_fragment>',`
float nz=texture2D(tN,vW.xz*.0042).r,nz2=texture2D(tN,vW.xz*.029+.5).r;vec4 w=vSp;
w.y=clamp(w.y+(nz-.5)*1.1*(1.-w.w)*(1.-w.z),0.,1.);w.z=clamp(w.z*(.75+nz2*.6),0.,1.);w.x*=1.-w.y;w/=max(dot(w,vec4(1.)),.001);
vec3 tc=tx(tG)*w.x+tx(tD)*w.y+tx(tR)*w.z+tx(tS)*w.w;tc=pow(tc,vec3(2.2));diffuseColor.rgb*=tc*(.86+.3*nz2);`)};
const mesh=new T.Mesh(g,m);mesh.receiveShadow=true;scene.add(mesh);return mesh})();

/* ---------- Engeller: ızgara + çarpışma ---------- */
const GC=25,GN=Math.ceil(2*W/GC),GRID=Array.from({length:GN*GN},()=>[]),OB=[];let QS=1;
function gAdd(o){const r=o.br,f=v=>cl(Math.floor((v+W)/GC),0,GN-1);for(let iz=f(o.z-r);iz<=f(o.z+r);iz++)for(let ix=f(o.x-r);ix<=f(o.x+r);ix++)GRID[iz*GN+ix].push(o);o.q=0;o.alive=1;OB.push(o);return o}
function gQuery(x,z,r,cb){QS++;const f=v=>cl(Math.floor((v+W)/GC),0,GN-1);for(let iz=f(z-r);iz<=f(z+r);iz++)for(let ix=f(x-r);ix<=f(x+r);ix++)for(const o of GRID[iz*GN+ix]){if(o.q===QS||!o.alive)continue;o.q=QS;cb(o)}}
const boxO=(k,x,z,hw,hd,a,y0,h)=>({k,x,z,hw,hd,a,c:Math.cos(a),s:Math.sin(a),y0,h,br:Math.hypot(hw,hd)});
function segOb(o,x0,y0,z0,dx,dy,dz,len){
if(o.hw){const px=x0-o.x,pz=z0-o.z,lx=px*o.c-pz*o.s,lz=px*o.s+pz*o.c,ux=dx*o.c-dz*o.s,uz=dx*o.s+dz*o.c;
let t0=0,t1=len,ax=0;for(let k=0;k<2;k++){const p=k?lz:lx,u=k?uz:ux,e=k?o.hd:o.hw;if(Math.abs(u)<1e-9){if(Math.abs(p)>e)return null;continue}
let a=(-e-p)/u,b=(e-p)/u,sg=-1;if(a>b){const t=a;a=b;b=t;sg=1}if(a>t0){t0=a;ax=(k+1)*sg}if(b<t1)t1=b;if(t0>t1)return null}
if(!ax)return null;const y=y0+dy*t0;if(y<o.y0||y>o.y0+o.h)return null;
let nx=0,nz=0;if(Math.abs(ax)===1)nx=ax<0?-1:1;else nz=ax<0?-1:1;
return{t:t0,nx:nx*o.c+nz*o.s,nz:-nx*o.s+nz*o.c,o}}
const r=o.sr||o.r,px=x0-o.x,pz=z0-o.z,a=dx*dx+dz*dz;if(a<1e-9)return null;const b=px*dx+pz*dz,c=px*px+pz*pz-r*r,D=b*b-a*c;if(D<0)return null;
const t=(-b-Math.sqrt(D))/a;if(t<0||t>len)return null;const y=y0+dy*t;if(y<o.y0||y>o.y0+o.h)return null;const hx=px+dx*t,hz=pz+dz*t,l=Math.hypot(hx,hz)||1;return{t,nx:hx/l,nz:hz/l,o}}
function segObs(x0,y0,z0,dx,dy,dz,len,flt){let best=null;const st=GC*.5;if(!(len>0)||len>5000)return null;
for(let s=0;s<=len+st;s+=st){const x=x0+dx*Math.min(s,len),z=z0+dz*Math.min(s,len);gQuery(x,z,st,o=>{if(flt&&!flt(o))return;const h=segOb(o,x0,y0,z0,dx,dy,dz,len);if(h&&(!best||h.t<best.t))best=h});if(best&&best.t<s)break}return best}
function segTerrain(x0,y0,z0,dx,dy,dz,len,step=2.5){if(!(len>0)||len>5000)return -1;let pt=0,pd=y0-hAt(x0,z0);if(pd<0)return 0;
for(let s=step;s<=len+step;s+=step){const t=Math.min(s,len),d=y0+dy*t-hAt(x0+dx*t,z0+dz*t);if(d<0){let a=pt,b=t;for(let k=0;k<8;k++){const m=(a+b)/2;(y0+dy*m-hAt(x0+dx*m,z0+dz*m))<0?b=m:a=m}return(a+b)/2}pt=t;if(t>=len)break}return -1}
function losClear(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz);if(!(l>1))return true;const ux=dx/l,uy=dy/l,uz=dz/l;
for(let s=6;s<l-3;s+=Math.max(6,s*.04))if(ay+uy*s<hAt(ax+ux*s,az+uz*s)+.4)return false;
return !segObs(ax,ay,az,ux,uy,uz,l-2,o=>o.k==='bld'||(o.k==='rock'&&o.h>2.2))}

/* ---------- Bitki örtüsü, kaya, bina geometrileri ---------- */
const dm=new T.Object3D(),UT={value:0};
function blob(det,sx,sy,sz,ox,oy,oz,amp,fq,sd,flat){const g=new T.IcosahedronGeometry(1,det),p=g.attributes.position,nr=g.attributes.normal;
for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=1+amp*noise(x*fq+sd,y*fq-z*fq*.7+sd*.3);p.setXYZ(i,x*d*sx+ox,y*d*sy+oy,z*d*sz+oz);
const n=new T.Vector3(x/sx,y/sy,z/sz).normalize();nr.setXYZ(i,n.x,n.y,n.z)}if(flat)g.computeVertexNormals();return g}
function cyl(r0,r1,h,seg,y){const g=new T.CylinderGeometry(r1,r0,h,seg,1,true).toNonIndexed();g.translate(0,y+h/2,0);return g}
function mergeG(list){let n=0;list.forEach(([g])=>n+=g.attributes.position.count);const P=new Float32Array(n*3),Nn=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
for(const[g,c]of list){const k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);
for(let i=0;i<k;i++){const v=c.v?.88+.24*rnd():1;C[(o+i)*3]=c.r*v;C[(o+i)*3+1]=c.g*v;C[(o+i)*3+2]=c.b*v}o+=k}
const r=new T.BufferGeometry();r.setAttribute('position',new T.BufferAttribute(P,3));r.setAttribute('normal',new T.BufferAttribute(Nn,3));r.setAttribute('color',new T.BufferAttribute(C,3));return r}
const lin=h=>new T.Color(h).convertSRGBToLinear(),col=(h,v)=>{const c=lin(h);c.v=v;return c};
const GEO={
broad:mergeG([[cyl(.27,.17,2.4,6,-.3),col(0x4a3a2a)],[blob(1,1.9,1.35,1.9,0,3.1,0,.28,1.7,1),col(0x55682f,1)],[blob(1,1.35,1.05,1.35,1.05,2.6,.4,.3,1.9,2),col(0x617436,1)],[blob(1,1.25,1,1.25,-.9,2.75,-.5,.3,2.1,3),col(0x4d612b,1)],[blob(1,1.1,.9,1.1,.1,3.85,.2,.25,2,4),col(0x6a7a3a,1)]]),
cypress:mergeG([[cyl(.2,.14,1.4,5,-.2),col(0x3e3024)],[blob(1,.85,3.2,.85,0,4,0,.18,2.2,5),col(0x2f4528,1)],[blob(1,.6,1.2,.6,0,6.6,0,.15,2.6,6),col(0x36502c,1)]]),
pine:mergeG([[cyl(.24,.12,3.2,6,-.2),col(0x4a3828)],[blob(1,1.9,1.5,1.9,0,3.4,0,.22,1.5,7),col(0x324a2a,1)],[blob(1,1.45,1.3,1.45,0,4.8,0,.22,1.7,8),col(0x3a5530,1)],[blob(1,.95,1.1,.95,0,6,0,.2,2,9),col(0x41602f,1)]]),
bush:mergeG([[blob(1,1.25,.75,1.25,0,.35,0,.35,1.8,10),col(0x6e7238,1)],[blob(0,.8,.6,.8,.7,.3,.3,.3,2,11),col(0x7c7a3e,1)]]),
rock:mergeG([[blob(1,1,.72,1.1,0,.1,0,.42,1.3,12,1),new T.Color(1,1,1)]]),
pole:mergeG([[cyl(.13,.1,7.5,5,0),col(0x4a3a2c)],[(()=>{const g=new T.BoxGeometry(1.8,.12,.12).toNonIndexed();g.translate(0,7,0);return g})(),col(0x3e3226)]])};
function vegMat(){const m=new T.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0,envMapIntensity:.5});
m.onBeforeCompile=s=>{s.uniforms.uT=UT;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
vec3 ip=instanceMatrix[3].xyz;float sw=sin(uT*1.6+ip.x*.13+ip.z*.11)*.6+sin(uT*2.7+ip.x*.07-ip.z*.05)*.3;float hk=max(position.y-1.4,0.);transformed.x+=sw*.04*hk;transformed.z+=sw*.025*hk;
#endif`)};return m}
const MAT={veg:vegMat(),rock:new T.MeshStandardMaterial({vertexColors:true,roughness:.9,metalness:0,envMapIntensity:.6}),pole:new T.MeshStandardMaterial({vertexColors:true,roughness:.9})};
function setM(m,i,o){dm.position.set(o.x,o.y,o.z);dm.rotation.set(o.rx||0,o.ry||0,o.rz||0,'YXZ');dm.scale.set(o.sx,o.sy,o.sz);dm.updateMatrix();m.setMatrixAt(i,dm.matrix);if(o.colr)m.setColorAt(i,o.colr);o.im=m;o.i=i}
function chunked(geo,mat,list,shadow,cs=225){const G=new Map();list.forEach(o=>{const k=Math.floor((o.x+W)/cs)+'_'+Math.floor((o.z+W)/cs);if(!G.has(k))G.set(k,[]);G.get(k).push(o)});
G.forEach(arr=>{const g=new T.BufferGeometry();for(const k in geo.attributes)g.setAttribute(k,geo.attributes[k]);if(geo.index)g.setIndex(geo.index);
const m=new T.InstancedMesh(g,mat,arr.length);let cx=0,cy=0,cz=0;arr.forEach(o=>{cx+=o.x;cy+=o.y;cz+=o.z});cx/=arr.length;cy/=arr.length;cz/=arr.length;let r=0;
arr.forEach((o,i)=>{setM(m,i,o);r=Math.max(r,Math.hypot(o.x-cx,o.y-cy,o.z-cz)+8*Math.max(o.sx,o.sy,o.sz))});if(m.instanceColor)m.instanceColor.needsUpdate=true;
g.boundingSphere=new T.Sphere(new T.Vector3(cx,cy,cz),r+4);m.castShadow=shadow;m.receiveShadow=true;scene.add(m)})}

/* ---------- Bina dokusu ---------- */
const texB=cTex(256,(x,s)=>{x.fillStyle='#d8cdb4';x.fillRect(0,0,s,s);speck(x,s,500,['#c4b89c','#e6dcc4','#b9ab8e','#a8987a'],2,12,.25);
x.fillStyle='rgba(90,72,50,.18)';x.fillRect(0,s*.9,s,s*.1);
const wx=s*.3,wy=s*.2,ww=s*.4,wh=s*.42;x.fillStyle='#8a7c64';x.fillRect(wx-6,wy-6,ww+12,wh+12);x.fillStyle='#2a2622';x.fillRect(wx,wy,ww,wh);
x.fillStyle='rgba(120,140,150,.25)';x.fillRect(wx+4,wy+4,ww/2-6,wh-8);x.fillStyle='#5a4a3a';x.fillRect(wx+ww/2-2,wy,4,wh);x.fillStyle='#9a8a70';x.fillRect(wx-8,wy+wh+4,ww+16,6);
x.fillStyle='rgba(60,50,40,.25)';for(let i=0;i<8;i++){x.fillRect(wx+rnd()*ww,wy+wh+10,2,rnd()*s*.25)}});
const bMat=new T.MeshStandardMaterial({map:texB,roughness:.93,metalness:0,envMapIntensity:.6});
bMat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vL;varying vec3 vON;').replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
vL=position*vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
#else
vL=position;
#endif
vON=normal;`);
s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vL;varying vec3 vON;').replace('#include <map_fragment>',`
vec3 an=abs(vON);vec2 bu=an.y>.5?vec2(vL.x,vL.z)/3.:(an.x>.5?vec2(vL.z,vL.y):vec2(vL.x,vL.y))/3.;
if(an.y>.5)bu=vec2(fract(bu.x),fract(bu.y)*.12+.88);else if(vL.y<1.)bu.y=fract(bu.y)*.08+.9;
vec4 tc=texture2D(map,bu);diffuseColor*=mapTexelToLinear(tc);if(an.y>.5)diffuseColor.rgb*=.82;`)};
const wallMat=new T.MeshStandardMaterial({map:texR,color:lin(0xc9b89a),roughness:.95});

/* ---------- Harita yerleşimi ---------- */
const BLD=[],nearB=(x,z,pad)=>BLD.some(b=>Math.hypot(b.x-x,b.z-z)<b.br+pad);
function tryBld(x,z,a,hw,hd,h,ruin){const br=Math.hypot(hw,hd);
if(Math.abs(x)>BA-20||Math.abs(z)>BA-20)return 0;if(roadD(x,z)-br<4.5)return 0;
if(CAPS.some(c=>Math.hypot(x-c.x,z-c.z)<(c.id==='B'?30:c.r+6)+br))return 0;
if(Math.hypot(x-SPAWN.blue.x,z-SPAWN.blue.z)<90||Math.hypot(x-SPAWN.red.x,z-SPAWN.red.z)<90)return 0;
if(Math.abs(z-wadiZ(x))<14+br)return 0;if(nearB(x,z,br+3.5))return 0;
const c=Math.cos(a),s=Math.sin(a);let mn=1e9,mx=-1e9;for(const[u,v]of[[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]){const lx=u*hw,lz=v*hd,y=hAt(x+lx*c+lz*s,z-lx*s+lz*c);mn=Math.min(mn,y);mx=Math.max(mx,y)}
if(mx-mn>3.2)return 0;const y0=mn-.6,top=mx+h;const b=boxO('bld',x,z,hw,hd,a,y0,top-y0);b.ruin=ruin;BLD.push(b);gAdd(b);return b}
{const B=CAPS[1];let n=0;for(let i=0;i<900&&n<48;i++){const ang=rnd()*6.283,d=36+Math.pow(rnd(),.75)*135,x=B.x+Math.cos(ang)*d,z=B.z+Math.sin(ang)*d,ri=roadInfo(x,z),
a=Math.atan2(ri.s.dx,ri.s.dz)+(rnd()<.5?0:Math.PI/2)+V(-.06,.06),ru=rnd()<.14,two=rnd()<.28;
if(tryBld(x,z,a,V(3.2,6),V(3.2,6.5),ru?V(1.5,2.8):two?V(6.2,7):V(3.4,3.9),ru))n++}
for(const[cx,cz,k,R0]of[[CAPS[0].x,CAPS[0].z,7,48],[CAPS[2].x,CAPS[2].z,6,46],[150,250,3,30],[-330,-120,4,30],[330,180,3,26],[-150,-330,3,28],[200,-260,3,28]]){let m=0;
for(let i=0;i<200&&m<k;i++){const ang=rnd()*6.283,d=R0+rnd()*40,x=cx+Math.cos(ang)*d,z=cz+Math.sin(ang)*d,ri=roadInfo(x,z),a=Math.atan2(ri.s.dx,ri.s.dz)+(rnd()<.5?0:Math.PI/2);
if(tryBld(x,z,a,V(3,5.5),V(3,6),rnd()<.2?V(1.4,2.6):V(3.4,3.9),0))m++}}}
const WALLS=[];let wallIM=null;
BLD.forEach(b=>{if(rnd()>.45||b.ruin)return;const off=V(3,5),L=b.hw+off,Dd=b.hd+off;
for(const[u,v,len,rot]of[[0,1,L,0],[1,0,Dd,Math.PI/2]]){const sg=rnd()<.5?1:-1,lx=u*sg*L,lz=v*sg*Dd,x=b.x+lx*b.c+lz*b.s,z=b.z-lx*b.s+lz*b.c,a=b.a+rot;
if(roadD(x,z)<5||nearB(x,z,.5))continue;const y=hAt(x,z);const w=boxO('wall',x,z,len*V(.6,1),.28,a,y-.5,1.9);WALLS.push(w);gAdd(w)}});
{const bm=new T.InstancedMesh((()=>{const g=new T.BoxGeometry(1,1,1);g.translate(0,.5,0);return g})(),bMat,BLD.length),cols=[0xf0e6d2,0xe8dcc0,0xdccaa6,0xefe3cb,0xd8c4a0,0xc9b48e];
BLD.forEach((b,i)=>{setM(bm,i,{x:b.x,y:b.y0,z:b.z,ry:b.a,sx:b.hw*2,sy:b.h,sz:b.hd*2,colr:lin(b.ruin?0x9a8c76:cols[i%cols.length])})});
bm.instanceColor.needsUpdate=true;bm.castShadow=bm.receiveShadow=true;bm.frustumCulled=false;scene.add(bm);
wallIM=new T.InstancedMesh((()=>{const g=new T.BoxGeometry(1,1,1);g.translate(0,.5,0);return g})(),wallMat,Math.max(1,WALLS.length));
WALLS.forEach((w,i)=>setM(wallIM,i,{x:w.x,y:w.y0,z:w.z,ry:w.a,sx:w.hw*2,sy:w.h,sz:w.hd*2}));wallIM.count=WALLS.length;wallIM.castShadow=wallIM.receiveShadow=true;wallIM.frustumCulled=false;scene.add(wallIM)}
const okVeg=(x,z,rr,rd=6)=>Math.abs(x)<760&&Math.abs(z)<760&&roadD(x,z)>rd&&!nearB(x,z,rr+1.5)&&!CAPS.some(c=>Math.hypot(x-c.x,z-c.z)<(c.id==='B'?34:c.r*.75))&&
Math.hypot(x-SPAWN.blue.x,z-SPAWN.blue.z)>65&&Math.hypot(x-SPAWN.red.x,z-SPAWN.red.z)>65&&!WALLS.some(w=>Math.hypot(w.x-x,w.z-z)<w.br+1);
const TREES={broad:[],cypress:[],pine:[]},addTree=(k,x,z,s)=>{const y=hAt(x,z);const o={k:'tree',t:k,x,y,z,sx:s,sy:s*V(.9,1.2),sz:s,ry:rnd()*6.28,r:.55*s,sr:.32*s,y0:y-.5,h:(k==='broad'?3:2.4)*s,br:1};TREES[k].push(o);gAdd(o)};
for(const[cx,cz,a,nx,nz]of[[-118,128,.3,7,10],[160,88,-.2,6,9],[-96,-170,.6,8,7],[120,-150,.1,6,8]])for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const lx=(i-nx/2)*8+V(-1,1),lz=(j-nz/2)*8+V(-1,1),x=cx+lx*Math.cos(a)+lz*Math.sin(a),z=cz-lx*Math.sin(a)+lz*Math.cos(a);if(okVeg(x,z,1))addTree('broad',x,z,V(.75,1.05))}
const roadZ=(x,z0,z1)=>{let zb=0,db=1e9;for(let z=z0;z<z1;z+=2){const d=roadD(x,z);if(d<db){db=d;zb=z}}return zb};
for(let x=-230;x<230;x+=13){const zr=roadZ(x,-80,80);for(const sg of[-1,1]){const z=zr+sg*10;if(okVeg(x,z,1,7))addTree('cypress',x,z,V(.85,1.15))}}
for(let i=0;i<9000&&TREES.broad.length+TREES.pine.length<Q.trees;i++){const x=V(-740,740),z=V(-740,740),d=fbm(x/170+11,z/170-5,3);if(d<.08+rnd()*.32)continue;
if(!okVeg(x,z,1.2))continue;const y=hAt(x,z),k=y>22&&rnd()<.6?'pine':rnd()<.12?'cypress':'broad';addTree(k,x,z,V(.8,1.35))}
const BUSH=[];for(let i=0;i<Q.bushes*3&&BUSH.length<Q.bushes;i++){const x=V(-720,720),z=V(-720,720);if(fbm(x/120-3,z/120+8,2)<-.1+rnd()*.2||!okVeg(x,z,.5,3.5))continue;const s=V(.6,1.4);BUSH.push({x,y:hAt(x,z)-.1,z,sx:s,sy:s*V(.7,1.1),sz:s,ry:rnd()*6.28})}
const ROCK=[];for(let i=0;i<6000&&ROCK.length<Q.rocks;i++){const x=V(-720,720),z=V(-720,720),nv=nAt(x,z);if((1-nv.y)<.04&&rnd()>.15)continue;if(!okVeg(x,z,2,5))continue;
const s=rnd()<.12?V(2.6,4):V(.7,2.2),y=hAt(x,z),o={k:'rock',x,y:y-s*.2,z,sx:s,sy:s*V(.6,1),sz:s*V(.8,1.2),rx:V(-.3,.3),ry:rnd()*6.28,rz:V(-.3,.3),r:s*.9,y0:y-1,h:s*.85+.8,br:s,colr:new T.Color().setHSL(.08+V(-.02,.02),.12,V(.36,.5)).convertSRGBToLinear()};ROCK.push(o);if(s>1.1)gAdd(o)}
const POLE=[];for(let x=-540;x<540;x+=46){const z=roadZ(x,-160,160)-8;if(!okVeg(x,z,.5,5))continue;const y=hAt(x,z),o={k:'pole',x,y:y-.3,z,sx:1,sy:1,sz:1,ry:Math.PI/2+V(-.05,.05),r:.35,sr:.2,y0:y-.3,h:7.5,br:1};POLE.push(o);gAdd(o)}
chunked(GEO.broad,MAT.veg,TREES.broad,true);chunked(GEO.cypress,MAT.veg,TREES.cypress,true);chunked(GEO.pine,MAT.veg,TREES.pine,true);
chunked(GEO.bush,MAT.veg,BUSH,Q.hi);chunked(GEO.rock,MAT.rock,ROCK,true);chunked(GEO.pole,MAT.pole,POLE,true,400);
const FALL=[],_q=new T.Quaternion(),_q2=new T.Quaternion(),_ax=new T.Vector3(),_eu=new T.Euler();
function knock(o,dx,dz){if(o.fall!=null)return;o.alive=0;o.fall=0;const l=Math.hypot(dx,dz)||1;o.fx=dx/l;o.fz=dz/l;FALL.push(o);dustAt(o.x,o.y+1,o.z,6,1.2)}
function updFall(dt){for(let i=FALL.length-1;i>=0;i--){const o=FALL[i];o.fall=Math.min(1,o.fall+dt*(.6+o.fall*2.2));const a=Math.pow(o.fall,1.7)*(o.k==='pole'?1.45:1.38);
_ax.set(o.fz,0,-o.fx);_q.setFromAxisAngle(_ax,a);_q2.setFromEuler(_eu.set(0,o.ry,0));dm.quaternion.copy(_q).multiply(_q2);dm.position.set(o.x,o.y,o.z);dm.scale.set(o.sx,o.sy,o.sz);dm.updateMatrix();
o.im.setMatrixAt(o.i,dm.matrix);o.im.instanceMatrix.needsUpdate=true;if(o.fall>=1){FALL.splice(i,1);dustAt(o.x+o.fx*4,o.y+.5,o.z+o.fz*4,5,1.4)}}}
function breakWall(o){o.alive=0;const i=WALLS.indexOf(o);if(wallIM&&i>=0){dm.position.set(0,-999,0);dm.scale.set(.001,.001,.001);dm.rotation.set(0,0,0);dm.updateMatrix();wallIM.setMatrixAt(i,dm.matrix);wallIM.instanceMatrix.needsUpdate=true}
for(let k=0;k<10;k++)fxP(SMK,o.x+RV(-o.hw,o.hw)*o.c,o.y0+1,o.z-RV(-o.hw,o.hw)*o.s,RV(-1,1),RV(.5,2),RV(-1,1),RV(1.2,2.2),1.2,4,[.62,.56,.47],.5,0,.4)}

/* ---------- Parçacıklar (tek çizimli, örneklenmiş) ---------- */
const puff=cTex(128,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
x.fillStyle=g;x.fillRect(0,0,s,s);x.globalCompositeOperation='destination-out';for(let i=0;i<70;i++){const a=rnd()*6.28,r=rnd()*s*.42;x.fillStyle=`rgba(0,0,0,${.08+rnd()*.12})`;x.beginPath();x.arc(s/2+Math.cos(a)*r,s/2+Math.sin(a)*r,4+rnd()*12,0,7);x.fill()}},1);
puff.wrapS=puff.wrapT=T.ClampToEdgeWrapping;
function PSys(max,add){const base=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
const ip=new Float32Array(max*3),ic=new Float32Array(max*4),is=new Float32Array(max*2);
const A=[new T.InstancedBufferAttribute(ip,3),new T.InstancedBufferAttribute(ic,4),new T.InstancedBufferAttribute(is,2)];A.forEach(a=>a.setUsage(T.DynamicDrawUsage));
g.setAttribute('ip',A[0]);g.setAttribute('ic',A[1]);g.setAttribute('is',A[2]);g.instanceCount=0;
const m=new T.ShaderMaterial({uniforms:{map:{value:puff},fd:{value:FOGD},fc:{value:HOR}},transparent:true,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending,
vertexShader:`attribute vec3 ip;attribute vec4 ic;attribute vec2 is;uniform float fd;varying vec2 vUv;varying vec4 vC;varying float vF;
void main(){vUv=uv;vC=ic;float c=cos(is.y),s=sin(is.y);vec2 q=vec2(position.x*c-position.y*s,position.x*s+position.y*c)*is.x;
vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),u=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
vec4 mv=viewMatrix*vec4(ip+r*q.x+u*q.y,1.);gl_Position=projectionMatrix*mv;float d=-mv.z;vF=1.-exp(-fd*fd*d*d);}`,
fragmentShader:`uniform sampler2D map;uniform vec3 fc;varying vec2 vUv;varying vec4 vC;varying float vF;
void main(){float a=texture2D(map,vUv).a*vC.a;if(a<.004)discard;`+(add?`gl_FragColor=vec4(vC.rgb*(1.-vF),a);`:`gl_FragColor=vec4(mix(vC.rgb,fc,vF),a);`)+`
#include <tonemapping_fragment>
#include <encodings_fragment>
}`});
const mesh=new T.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=add?3:2;scene.add(mesh);
const P=[];for(let i=0;i<max;i++)P.push({life:0});let head=0;
return{P,max,spawn(o){const p=P[head];head=(head+1)%max;Object.assign(p,o);p.max=o.life;p.rot=RV(0,6.28);return p},
update(dt,wx,wz){let n=0;for(const p of P){if(p.life<=0)continue;p.life-=dt;if(p.life<=0)continue;const k=1-p.life/p.max,dr=Math.exp(-p.drag*dt);
p.vx=(p.vx-wx)*dr+wx;p.vz=(p.vz-wz)*dr+wz;p.vy=p.vy*dr-p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
ip[n*3]=p.x;ip[n*3+1]=p.y;ip[n*3+2]=p.z;const f=p.fade?(1-k)*Math.min(1,k*12+.05):(1-k*k)*Math.min(1,k*6+.15);
ic[n*4]=p.r;ic[n*4+1]=p.g;ic[n*4+2]=p.b;ic[n*4+3]=p.a*f;is[n*2]=lp(p.s0,p.s1,1-(1-k)*(1-k));is[n*2+1]=p.rot;n++}
g.instanceCount=n;if(n)A.forEach(a=>{a.needsUpdate=true;a.updateRange.offset=0;a.updateRange.count=n*a.itemSize})}}}
const ADD=PSys(Math.round(1400*Q.part),1),SMK=PSys(Math.round(2000*Q.part),0),WIND={x:1.4,z:.5};
function fxP(sys,x,y,z,vx,vy,vz,life,s0,s1,c,a,grav,drag,fade,vr){if(sys===SMK&&Q.part<1&&Math.random()>Q.part+.2)return;
return sys.spawn({x,y,z,vx,vy,vz,life,s0,s1,r:c[0],g:c[1],b:c[2],a,grav:grav||0,drag:drag||0,fade:fade||0,vr:vr==null?RV(-.6,.6):vr})}
const FIRE=[5.5,2.4,.7],SPARK=[7,4.2,1.6],DUSTC=[.45,.37,.27],SMOKE=[.12,.115,.11],GREY=[.36,.35,.33];
function dustAt(x,y,z,n,s){for(let i=0;i<n;i++)fxP(SMK,x+RV(-1,1)*s,y,z+RV(-1,1)*s,RV(-1.5,1.5),RV(.5,2.5),RV(-1.5,1.5),RV(1.5,3),s*.8,s*3.2,DUSTC,.42,0,.6)}
function muzzleFx(p,d,big,kind){const k=big?1:.45;
for(let i=0;i<(big?7:3);i++){const s=i*(big?.55:.25);fxP(ADD,p.x+d.x*s,p.y+d.y*s,p.z+d.z*s,d.x*RV(4,14),d.y*RV(4,14),d.z*RV(4,14),RV(.06,.12),(big?2.4:.9)*(1-i*.08),(big?1.1:.5),FIRE,1,0,0,0,0)}
for(let i=0;i<(big?5:2);i++)fxP(ADD,p.x,p.y,p.z,RV(-1,1)*3+d.x*5,RV(-1,1)*3+d.y*5,RV(-1,1)*3+d.z*5,.07,(big?3.2:1.2),(big?1.8:.6),[6,3.2,1.2],1,0,0,0,0);
for(let i=0;i<(big?14:2);i++){const sp=RV(2,big?16:6);fxP(SMK,p.x+d.x*RV(0,2),p.y+d.y*RV(0,2),p.z+d.z*RV(0,2),d.x*sp+RV(-1.6,1.6)*k,d.y*sp+RV(-.5,1.6),d.z*sp+RV(-1.6,1.6)*k,RV(1.4,3.4)*k+.4,1*k+.3,RV(4,7)*k+.6,[.55,.53,.5],big?.45:.25,-.25,1.5)}
if(kind==='atgm')for(let i=0;i<14;i++)fxP(SMK,p.x,p.y,p.z,RV(-3,3)-d.x*4,RV(-1,2),RV(-3,3)-d.z*4,RV(1,2.5),1,4,[.6,.59,.57],.45,0,1.2);
flashT=big?1:.35;flash.position.copy(p)}
function boom(x,y,z,k,dark){for(let i=0;i<10*k;i++)fxP(ADD,x+RV(-.5,.5)*k,y+RV(0,1)*k,z+RV(-.5,.5)*k,RV(-5,5)*k,RV(1,8)*k,RV(-5,5)*k,RV(.25,.6),1.5*k,4.2*k,FIRE,1,-1,1.5,0);
for(let i=0;i<8*k;i++)fxP(SMK,x,y+.5,z,RV(-3,3)*k,RV(1,5)*k,RV(-3,3)*k,RV(2.5,5),2*k,7.5*k,dark?SMOKE:[.2,.19,.18],.6,-.4,.7);
for(let i=0;i<10*k;i++)fxP(ADD,x,y,z,RV(-12,12),RV(3,16),RV(-12,12),RV(.5,1.1),.35,.12,SPARK,1,14,.2,0);
flashT=Math.max(flashT,1.4);flash.position.set(x,y+2,z)}
function impactFx(x,y,z,nx,ny,nz,kind,big){const k=big?1:.5;
if(kind==='ground'){for(let i=0;i<9*k+2;i++)fxP(SMK,x,y,z,nx*RV(2,7)+RV(-2,2),RV(3,9)*k+1,nz*RV(2,7)+RV(-2,2),RV(1.2,2.6),.8*k+.3,4*k+.8,DUSTC,.55,5,.9);
for(let i=0;i<6*k;i++)fxP(SMK,x,y,z,RV(-6,6),RV(4,12),RV(-6,6),RV(.5,1),.25,.15,[.2,.15,.1],.9,18,.1,1)}
else if(kind==='ric'){for(let i=0;i<7;i++)fxP(ADD,x,y,z,nx*8+RV(-6,6),ny*8+RV(-2,8),nz*8+RV(-6,6),RV(.15,.35),.25,.08,SPARK,1,9,0,1,0);fxP(ADD,x,y,z,0,0,0,.08,1.6,.4,[5,4,3],1,0,0,1,0)}
else if(kind==='metal'||kind==='pen'){for(let i=0;i<(kind==='pen'?12:8)*k+3;i++)fxP(ADD,x,y,z,nx*RV(2,9)+RV(-5,5),ny*RV(2,9)+RV(-2,6),nz*RV(2,9)+RV(-5,5),RV(.2,.45),.3,.1,SPARK,1,9,.2,1,0);
fxP(ADD,x,y,z,0,0,0,.09,2.6*k+.8,.6,[6,3.6,1.6],1,0,0,1,0);for(let i=0;i<3;i++)fxP(SMK,x,y,z,nx*2,RV(.5,2),nz*2,RV(1,2),.5,2.4*k+.5,GREY,.4,0,1);flashT=Math.max(flashT,.4*k+.2);flash.position.set(x,y,z)}
else if(kind==='expl'){boom(x,y,z,big?1:.55,0)}
else if(kind==='wood'){for(let i=0;i<8;i++)fxP(SMK,x,y,z,RV(-3,3),RV(1,4),RV(-3,3),RV(.6,1.2),.3,.6,[.3,.25,.14],.7,8,.3,1);dustAt(x,y,z,3,.8)}
else if(kind==='bld'){dustAt(x,y,z,8,1.4);for(let i=0;i<6;i++)fxP(SMK,x,y,z,nx*5+RV(-3,3),RV(0,4),nz*5+RV(-3,3),RV(.6,1.2),.35,.25,[.55,.5,.42],.9,14,.1,1)}}

/* ---------- Palet izleri ---------- */
const MARK=(()=>{const max=Q.marks,pos=new Float32Array(max*12),uv=new Float32Array(max*8),age=new Float32Array(max*4).fill(-999),idx=new Uint32Array(max*6);
for(let k=0;k<max;k++){const b=k*4;idx.set([b,b+2,b+1,b+1,b+2,b+3],k*6)}
const g=new T.BufferGeometry(),PA=new T.BufferAttribute(pos,3),UA=new T.BufferAttribute(uv,2),AA=new T.BufferAttribute(age,1);[PA,UA,AA].forEach(a=>a.setUsage(T.DynamicDrawUsage));
g.setAttribute('position',PA);g.setAttribute('uv',UA);g.setAttribute('ag',AA);g.setIndex(new T.BufferAttribute(idx,1));g.boundingSphere=new T.Sphere(new T.Vector3(),5000);
const tt=cTex(64,(x,s)=>{x.clearRect(0,0,s,s);for(let i=0;i<4;i++){x.fillStyle='rgba(255,255,255,.95)';x.fillRect(4,i*16+2,s-8,9)}x.fillStyle='rgba(255,255,255,.5)';x.fillRect(0,0,4,s);x.fillRect(s-4,0,4,s)},1);
const m=new T.ShaderMaterial({uniforms:{map:{value:tt},now:{value:0},fd:{value:FOGD},fc:{value:HOR}},transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
vertexShader:'attribute float ag;uniform float now,fd;varying vec2 vUv;varying float vA,vF;void main(){vUv=uv;vA=clamp(1.-(now-ag)/70.,0.,1.);vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vF=1.-exp(-fd*fd*mv.z*mv.z);}',
fragmentShader:`uniform sampler2D map;uniform vec3 fc;varying vec2 vUv;varying float vA,vF;void main(){float a=texture2D(map,vUv).a*vA*.42;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(.1,.075,.05),fc,vF),a*(1.-vF));
#include <tonemapping_fragment>
#include <encodings_fragment>
}`});
const mesh=new T.Mesh(g,m);mesh.renderOrder=1;mesh.frustumCulled=false;scene.add(mesh);let head=0,lo=1e9,hi=-1;
return{m,add(ax,az,bx,bz,cx,cz,dx,dz,v0,v1){const k=head;head=(head+1)%max;const b=k*12,y=(x,z)=>hAt(x,z)+.05;
pos.set([ax,y(ax,az),az,bx,y(bx,bz),bz,cx,y(cx,cz),cz,dx,y(dx,dz),dz],b);uv.set([0,v0,1,v0,0,v1,1,v1],k*8);age.fill(clock.t,k*4,k*4+4);lo=Math.min(lo,k);hi=Math.max(hi,k)},
flush(){m.uniforms.now.value=clock.t;if(hi<0)return;for(const[a,n]of[[PA,12],[UA,8],[AA,4]]){a.updateRange.offset=lo*n;a.updateRange.count=(hi-lo+1)*n;a.needsUpdate=true}lo=1e9;hi=-1}}})();

/* ---------- Ele geçirme noktaları (görsel) ---------- */
const TEAMC={blue:new T.Color(.25,.6,1),red:new T.Color(1,.28,.22),none:new T.Color(.95,.95,.9)};
CAPS.forEach(c=>{c.v=0;c.owner='none';
const g=new T.BufferGeometry(),n=120,P=[],I=[];for(let i=0;i<=n;i++){const a=i/n*6.2832,ca=Math.cos(a),sa=Math.sin(a);for(const r of[c.r-1.1,c.r]){const x=c.x+ca*r,z=c.z+sa*r;P.push(x,hAt(x,z)+.18,z)}}
for(let i=0;i<n;i++){const b=i*2;I.push(b,b+2,b+1,b+1,b+2,b+3)}g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);
c.mat=new T.MeshBasicMaterial({color:TEAMC.none.clone(),transparent:true,opacity:.75,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,side:T.DoubleSide});
const ring=new T.Mesh(g,c.mat);ring.renderOrder=1;scene.add(ring);
const y=hAt(c.x,c.z),pole=new T.Mesh(new T.CylinderGeometry(.09,.12,11,6),new T.MeshStandardMaterial({color:0x8a8a86,metalness:.6,roughness:.4}));pole.position.set(c.x,y+5.5,c.z);pole.castShadow=true;scene.add(pole);
c.flagM=new T.MeshStandardMaterial({color:TEAMC.none.clone(),roughness:.8,side:T.DoubleSide});c.flag=new T.Mesh(new T.PlaneGeometry(2.6,1.6,8,2),c.flagM);c.flag.position.set(c.x+1.3,y+10,c.z);c.flag.castShadow=true;scene.add(c.flag);c.fy=y});

/* ---------- Ses (WebAudio ile sentezlenir) ---------- */
const AU=(()=>{let C=null,M,NB,echo,eng=null;const _r=new T.Vector3();
function init(){if(C)return;try{C=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
M=C.createGain();M.gain.value=.65;const k=C.createDynamicsCompressor();k.threshold.value=-16;k.ratio.value=5;M.connect(k);k.connect(C.destination);
const n=C.sampleRate*2;NB=C.createBuffer(1,n,C.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
echo=C.createDelay(1);echo.delayTime.value=.31;const fb=C.createGain();fb.gain.value=.32;const ef=C.createBiquadFilter();ef.type='lowpass';ef.frequency.value=700;echo.connect(ef);ef.connect(fb);fb.connect(echo);ef.connect(M)}
const ok=()=>C&&C.state==='running';
function sp(p){if(!p)return{g:1,pan:0,dl:0,d:0};_r.setFromMatrixColumn(cam.matrixWorld,0);const dx=p.x-cam.position.x,dy=p.y-cam.position.y,dz=p.z-cam.position.z,d=Math.hypot(dx,dy,dz)||1;
return{g:1/(1+d/55),pan:cl((dx*_r.x+dz*_r.z)/d,-1,1)*.75,dl:d>40?d/340:0,d}}
function bus(s,g,ec){const o=C.createGain();o.gain.value=g;let n=o;if(C.createStereoPanner){const p=C.createStereoPanner();p.pan.value=s.pan;o.connect(p);n=p}n.connect(M);if(ec){const e=C.createGain();e.gain.value=ec;o.connect(e);e.connect(echo)}return o}
function nz(t,d){const s=C.createBufferSource();s.buffer=NB;s.loop=true;s.start(t,Math.random()*1.5);s.stop(t+d+.05);return s}
function filt(type,f,q){const b=C.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;return b}
function env(g,t,pk,a,dc){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dc)}
function tone(t,f0,f1,dur,pk,type,dst){const o=C.createOscillator(),g=C.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,pk,.005,dur);o.connect(g);g.connect(dst);o.start(t);o.stop(t+dur+.05)}
function burst(t,dur,pk,ft,f0,f1,dst,q){const s=nz(t,dur),f=filt(ft,f0,q),g=C.createGain();if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,pk,.004,dur);s.connect(f);f.connect(g);g.connect(dst)}
const S={
cannon(p,big){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,air=cl(5200/(1+s.d/120),300,5200),o=bus(s,s.g*(big?1:.55),big?.35:.1);
burst(t,big?1.7:.5,1,'lowpass',Math.min(air,1800),220,o);if(s.d<120)burst(t,.14,.55,'highpass',2200,0,o);tone(t,big?72:110,big?32:60,big?.6:.18,big?1:.5,'sine',o)},
auto(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.6,.08);burst(t,.16,.9,'lowpass',cl(4000/(1+s.d/150),400,4000),600,o);tone(t,150,70,.08,.6,'sine',o)},
atgm(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.7,.2);burst(t,1.4,.7,'bandpass',500,1800,o,.8);burst(t,.3,.8,'lowpass',900,200,o)},
ric(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.6,0);tone(t,RV(3200,4200),RV(900,1300),.45,.35,'sine',o);burst(t,.08,.5,'highpass',3000,0,o)},
clang(p,pen){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.8,.1);for(const[f,a]of[[RV(380,440),.5],[RV(1050,1200),.3],[RV(2200,2500),.18]])tone(t,f,f*.97,pen?.35:.7,a,'sine',o);
if(pen){burst(t,.35,.8,'bandpass',700,300,o,1);tone(t,90,40,.3,.7,'sine',o)}},
boom(p,k){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*Math.min(1.4,k),.4);burst(t,2.6*k,1,'lowpass',cl(1400/(1+s.d/200),200,1400),120,o);tone(t,55,25,1.1,1,'sine',o);burst(t,.5,.5,'bandpass',300,90,o,.6)},
thud(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.6,0);burst(t,.35,.8,'lowpass',500,120,o)},
ui(f){if(!ok())return;const o=bus({pan:0},.18,0);tone(C.currentTime,f||880,(f||880)*1.01,.07,.5,'square',o)},
load(){if(!ok())return;const o=bus({pan:0},.35,0),t=C.currentTime;burst(t,.08,.8,'bandpass',900,0,o,2);tone(t+.06,180,120,.12,.5,'triangle',o);burst(t+.12,.06,.6,'highpass',2500,0,o)},
brrt(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.7,.12);burst(t,.09,.8,'lowpass',cl(2400/(1+s.d/200),300,2400),400,o);tone(t,72,58,.08,.7,'sawtooth',o)},
rocket(p){if(!ok())return;const s=sp(p),t=C.currentTime+s.dl,o=bus(s,s.g*.6,.15);burst(t,.6,.7,'bandpass',900,2600,o,.7)},
warn(){if(!ok())return;const o=bus({pan:0},.12,0),t=C.currentTime;tone(t,1100,1100,.12,.6,'square',o);tone(t+.18,1100,1100,.12,.6,'square',o)},
crack(p){if(!ok())return;const s=sp(p);if(s.d>60)return;const o=bus(s,.5*(1-s.d/60),0),t=C.currentTime;burst(t,.05,1,'highpass',3500,0,o)}};
function engine(type,rpm,load,spd,on){if(!ok())return;const t=C.currentTime;
if(!eng||eng.type!==type){if(eng){eng.g.gain.setTargetAtTime(0,t,.1);const old=eng;setTimeout(()=>old.stop(),600)}
const g=C.createGain();g.gain.value=0;g.connect(M);const o1=C.createOscillator();o1.type='sawtooth';const f1=filt('lowpass',300,1.2);o1.connect(f1);const g1=C.createGain();f1.connect(g1);g1.connect(g);
const o2=C.createOscillator();o2.type='square';const g2=C.createGain();g2.gain.value=.06;o2.connect(g2);g2.connect(f1);
const ns=C.createBufferSource();ns.buffer=NB;ns.loop=true;const fr=filt('bandpass',140,.9),gr=C.createGain();ns.connect(fr);fr.connect(gr);gr.connect(g);
const tw=C.createOscillator();tw.type='sine';const gt=C.createGain();gt.gain.value=0;tw.connect(gt);gt.connect(g);
const fh=filt('highpass',2600),gh=C.createGain();gh.gain.value=0;ns.connect(fh);fh.connect(gh);gh.connect(g);
const fc=filt('bandpass',1300,.7),gc=C.createGain();gc.gain.value=0;ns.connect(fc);fc.connect(gc);gc.connect(g);const lfo=C.createOscillator();lfo.type='square';const ld=C.createGain();ld.gain.value=0;lfo.connect(ld);ld.connect(gc.gain);
[o1,o2,ns,tw,lfo].forEach(n=>n.start());eng={type,g,o1,o2,f1,g1,fr,gr,tw,gt,gh,gc,ld,lfo,stop(){[o1,o2,ns,tw,lfo].forEach(n=>{try{n.stop()}catch(e){}});g.disconnect()}}}
const e=eng,jt=type==='jet',tb=type!=='diesel',k=.08,base=(tb?24:30)+rpm*(tb?40:62);e.g.gain.setTargetAtTime(on?1:0,t,.15);
e.o1.frequency.setTargetAtTime(base,t,k);e.o2.frequency.setTargetAtTime(base*1.505,t,k);e.f1.frequency.setTargetAtTime(220+rpm*700+load*300,t,k);
e.g1.gain.setTargetAtTime((jt?.05:tb?.16:.3)*(.45+load*.55),t,k);e.fr.frequency.setTargetAtTime(110+rpm*260,t,k);e.gr.gain.setTargetAtTime((.25+load*.35)*(jt?1.3:tb?.8:1),t,k);
e.tw.frequency.setTargetAtTime(jt?1500+rpm*2600:tb?900+rpm*1900:40,t,k);e.gt.gain.setTargetAtTime(jt?.03+rpm*.04:tb?.025+rpm*.05:0,t,k);e.gh.gain.setTargetAtTime(jt?.06+rpm*.1:tb?.02+rpm*.05:.01,t,k);
const sv=jt?0:Math.min(1,Math.abs(spd)/12);e.gc.gain.setTargetAtTime(sv*.09,t,k);e.ld.gain.setTargetAtTime(sv*.08,t,k);e.lfo.frequency.setTargetAtTime(Math.max(1,Math.abs(spd)/.19),t,k)}
return{init,resume:()=>{if(C&&C.state!=='running')C.resume()},S,engine,mute(m){if(M)M.gain.setTargetAtTime(m?0:.65,C.currentTime,.05)}}})();

/* ---------- Araç tanımları ---------- */
const VEH={
abrams:{key:'abrams',name:'M1A2 Abrams',short:'M1A2',hw:1.85,hl:3.95,cz:0,mass:62,vmax:19.2,vrev:9.4,acc:3.7,turn:.74,trav:40*DEG,elevSpd:24*DEG,elev:[-9*DEG,20*DEG],zoom:[3,10],eng:'turbine',camH:3.2,repair:12,rld:6.5,gunName:'120 mm M256',
desc:'120 mm M256 topu · kompozit taret zırhı · 1500 bg gaz türbini. Önden çok dayanıklı; üst ön plaka, taret yanları ve arkası zayıf noktalar.',
crew:[{id:'driver',n:'Sürücü',c:[0,1.05,2.75],s:[.62,.6,.9]},{id:'gunner',n:'Nişancı',t:1,c:[-.55,.3,.6],s:[.5,.8,.6]},{id:'commander',n:'Komutan',t:1,c:[-.6,.5,-.3],s:[.5,.9,.6]},{id:'loader',n:'Doldurucu',t:1,c:[.62,.38,.2],s:[.5,.9,.6]}],
mods:[{id:'engine',n:'Motor',c:[0,1,-2.6],s:[1.9,1,1.6],hp:130},{id:'trans',n:'Şanzıman',c:[0,.9,-3.6],s:[1.9,.8,.55],hp:110},
{id:'fuel',n:'Yakıt tankı',c:[.95,1,2.6],s:[.55,.7,1.4],hp:80,fuel:1},{id:'fuel2',n:'Yakıt tankı',c:[-.95,1,2.6],s:[.55,.7,1.4],hp:80,fuel:1},
{id:'ammo',n:'Gövde mühimmatı',c:[.95,1.05,.25],s:[.6,.6,.9],hp:60,ammo:1},{id:'ammo2',n:'Taret arkası mühimmatı',t:1,c:[0,.45,-2.3],s:[2.2,.6,1.1],hp:70,ammo:1,blow:1},
{id:'breech',n:'Top kamarası',t:1,c:[0,.3,.55],s:[.45,.45,1.1],hp:110},{id:'tdrive',n:'Taret tahriki',t:1,c:[.4,.02,.75],s:[.5,.3,.5],hp:90}],
armor(part,p,n){if(part==='hull'){if(n.z>.1&&p.z>2.4)return p.y<1.02?{t:580,c:1,n:'Alt ön plaka'}:{t:50,n:'Üst ön plaka'};if(n.y>.8)return{t:p.z<-1.6?30:40,n:'Gövde tavanı'};if(n.y<-.7)return{t:25,n:'Taban'};
if(n.z<-.5&&p.z<-3.2)return{t:40,n:'Arka zırh'};return{t:p.z>.8?75:55,n:'Yan zırh'}}
if(part==='turret'){if(n.y>.75)return{t:45,n:'Taret tavanı'};if(p.z>.2&&n.z>.3)return{t:760,c:1,n:'Taret ön zırhı'};if(p.z>-.6)return{t:300,c:1,n:'Taret yanı'};return{t:p.z<-1.6?55:70,n:'Taret arkası'}}
if(part==='gun')return p.z<.75?{t:430,c:1,n:'Top kalkanı'}:{t:0,barrel:1,n:'Namlu'};return{t:20,track:1,n:'Palet'}},
ammo:[{id:'ap',n:'M829A2',k:'APFSDS',v:1675,pen:610,drag:.035,n0:24,cal:120,spall:[8,48,20,4.2],core:170,col:[6,2.2,1]},
{id:'heat',n:'M830A1',k:'HEAT-FS',v:1410,pen:480,drag:.09,n0:16,cal:120,heat:1,he:1,spall:[7,42,17,3.4],core:200,col:[6,3,1]}]},
bradley:{key:'bradley',name:'M2A3 Bradley',short:'M2A3',hw:1.6,hl:3.2,cz:-.2,mass:30,vmax:17.6,vrev:7.4,acc:3.4,turn:.82,trav:50*DEG,elevSpd:40*DEG,elev:[-9*DEG,59*DEG],zoom:[4,12],eng:'diesel',camH:3,repair:9,gunName:'25 mm M242 + TOW-2',
desc:'25 mm M242 otomatik top (çift besleme) · BGM-71 TOW-2 tanksavar füzesi. Hafif zırhlı ama çevik; TOW ile Abrams\'ı bile durdurabilir — ateşlemek için dur.',
crew:[{id:'driver',n:'Sürücü',c:[.75,1.25,1.7],s:[.62,.6,.9]},{id:'gunner',n:'Nişancı',t:1,c:[.45,0,.1],s:[.5,.8,.6]},{id:'commander',n:'Komutan',t:1,c:[-.5,.05,-.1],s:[.5,.9,.6]}],
mods:[{id:'engine',n:'Motor',c:[-.75,1.2,1.7],s:[1,1,1.6],hp:110},{id:'trans',n:'Şanzıman',c:[0,.85,2.5],s:[2.4,.7,.6],hp:100},
{id:'fuel',n:'Yakıt tankı',c:[.95,1,-.6],s:[.5,.8,1.6],hp:70,fuel:1},{id:'ammo',n:'Taret mühimmatı',t:1,c:[0,-.45,-.35],s:[1,.5,.7],hp:50,ammo:1},
{id:'ammo2',n:'Arka mühimmat',c:[-.9,1.15,-2.4],s:[.6,.8,1],hp:55,ammo:1},{id:'breech',n:'Top mekanizması',t:1,c:[0,.38,.45],s:[.35,.35,.7],hp:90},{id:'tdrive',n:'Taret tahriki',t:1,c:[-.35,-.15,.35],s:[.4,.3,.4],hp:80}],
armor(part,p,n){if(part==='hull'){if(n.z>.1&&p.z>1.8)return{t:p.y<1.1?40:45,n:p.y<1.1?'Alt ön plaka':'Üst ön plaka'};if(n.y>.8)return{t:25,n:'Gövde tavanı'};if(n.y<-.7)return{t:15,n:'Taban'};
if(n.z<-.5&&p.z<-2.6)return{t:30,n:'Arka kapı'};return{t:33,n:'Yan zırh'}}
if(part==='turret'){if(n.y>.75)return{t:20,n:'Taret tavanı'};if(n.z>.35&&p.z>.2)return{t:45,n:'Taret ön zırhı'};return{t:28,n:p.z<-.5?'Taret arkası':'Taret yanı'}}
if(part==='gun')return p.z<.45?{t:30,n:'Top kalkanı'}:{t:0,barrel:1,n:'Namlu'};if(part==='tow')return{t:8,tow:1,n:'TOW rampası'};return{t:15,track:1,n:'Palet'}},
ammo:[{id:'ap',n:'M919',k:'APFSDS',v:1385,pen:102,drag:.18,n0:210,belt:70,auto:.3,cal:25,spall:[3,24,13,2.4],core:70,col:[6,1.6,.9]},
{id:'he',n:'M792',k:'HEI-T',v:1100,pen:7,drag:.26,n0:420,belt:140,auto:.3,cal:25,he:1,spall:[3,20,30,1.6],core:40,col:[6,2.8,1]},
{id:'atgm',n:'TOW-2',k:'ATGM',v:210,pen:900,n0:7,belt:2,cal:152,heat:1,atgm:1,spall:[10,46,24,4.6],core:320,col:[7,4,2]}]}};

/* ---------- Model + doku yükleme ---------- */
const MODELS={},TEX={},TL=new T.TextureLoader();
function parseGLB(buf){const dv=new DataView(buf),jl=dv.getUint32(12,true),J=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bo=20+jl+8,
CT={5126:Float32Array,5123:Uint16Array,5125:Uint32Array},NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},
acc=i=>{const a=J.accessors[i],v=J.bufferViews[a.bufferView];return new CT[a.componentType](buf,bo+(v.byteOffset||0)+(a.byteOffset||0),a.count*NC[a.type])};
const geos=J.meshes.map(m=>{const p=m.primitives[0],A=p.attributes,g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(acc(A.POSITION),3));
g.setAttribute('normal',new T.BufferAttribute(acc(A.NORMAL),3));g.setAttribute('uv',new T.BufferAttribute(acc(A.TEXCOORD_0),2));
if(A._WHEEL!=null)g.setAttribute('wheel',new T.BufferAttribute(acc(A._WHEEL),4));if(A._TRACK!=null)g.setAttribute('track',new T.BufferAttribute(acc(A._TRACK),4));
g.setIndex(new T.BufferAttribute(acc(p.indices),1));g.computeBoundingSphere();g.computeBoundingBox();return g});
const parts={};(function mk(i){const n=J.nodes[i];parts[n.name]={geo:n.mesh!=null?geos[n.mesh]:null,pos:new T.Vector3().fromArray(n.translation||[0,0,0])};(n.children||[]).forEach(mk)})(0);
return{parts,ex:J.nodes[0].extras||{}}}
function loadAssets(onP){const jobs=[];let done=0,total=11;const tick=()=>onP(++done/total);
const tx=(f,srgb)=>new Promise((res,rej)=>{TL.load('assets/tex/'+f+Q.tex+'.jpg',t=>{t.flipY=false;if(srgb)t.encoding=T.sRGBEncoding;t.anisotropy=Q.hi?8:4;tick();res(t)},undefined,()=>rej(new Error(f)))});
for(const k of['abrams','bradley','track'])jobs.push(Promise.all([tx(k+'_albedo',1),tx(k+'_normal'),tx(k+'_orm')]).then(([a,n,o])=>TEX[k]={a,n,o}));
for(const k of['abrams','bradley'])jobs.push(fetch('assets/models/'+k+'.glb').then(r=>{if(!r.ok)throw new Error(k);return r.arrayBuffer()}).then(b=>{MODELS[k]=parseGLB(b);tick()}));
return Promise.all(jobs)}

/* ---------- Tank örneği ---------- */
const TINT={blue:new T.Color(.8,.77,.72),red:new T.Color(.5,.58,.42)};
function tankMats(type,team){const tx=TEX[type],tt=TEX.track,c=TINT[team],ns=new T.Vector2(1,-1);
const std=(t,ci)=>new T.MeshStandardMaterial({map:t.a,normalMap:t.n,normalScale:ns,roughnessMap:t.o,metalnessMap:t.o,color:ci.clone(),envMapIntensity:.5});
const body=std(tx,c),wheel=std(tx,c),track=std(tt,c);
const wt={value:new T.Vector2()},to={value:new T.Vector2()};wheel.userData.u=wt;track.userData.u=to;
wheel.onBeforeCompile=s=>{s.uniforms.wTrav=wt;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 wheel;uniform vec2 wTrav;')
.replace('#include <beginnormal_vertex>','float wa=(wheel.w>0.?wTrav.x:wTrav.y)*wheel.z,wc=cos(wa),wsn=sin(wa);vec3 objectNormal=vec3(normal.x,normal.y*wc-normal.z*wsn,normal.y*wsn+normal.z*wc);')
.replace('#include <begin_vertex>','vec2 wq=position.yz-wheel.xy;vec3 transformed=vec3(position.x,wheel.x+wq.x*wc-wq.y*wsn,wheel.y+wq.x*wsn+wq.y*wc);')};
wheel.customProgramCacheKey=()=>'wheel';
track.onBeforeCompile=s=>{s.uniforms.tOff=to;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 track;uniform vec2 tOff;')
.replace('#include <begin_vertex>','vec3 transformed=position+vec3(0.,track.y,track.z)*(track.w>0.?tOff.x:tOff.y);')};
track.customProgramCacheKey=()=>'track';
return{body,wheel,track,all:[body,wheel,track]}}
function makeTank(type,team,name,isP){const D=VEH[type],M=MODELS[type],P=M.parts,ms=tankMats(type,team),root=new T.Group();
const mk=(k,mat,part)=>{const m=new T.Mesh(P[k].geo,mat);m.castShadow=m.receiveShadow=true;m.userData.part=part;return m};
const wheels=mk('wheels',ms.wheel,'track'),tracks=mk('tracks',ms.track,'track'),band=P.trackband?mk('trackband',ms.body,'track'):null;
const body=new T.Group();body.position.y=1.2;const inner=new T.Group();inner.position.y=-1.2;body.add(inner);
const hull=mk('hull',ms.body,'hull');inner.add(hull);
const turret=new T.Group();turret.position.copy(P.turret.pos);turret.userData.ring=P.turret.pos.clone();inner.add(turret);const turM=mk('turret',ms.body,'turret');turret.add(turM);
const gunPivot=new T.Group();gunPivot.position.copy(P.gun.pos);turret.add(gunPivot);const gun=mk('gun',ms.body,'gun');gunPivot.add(gun);
const muzzle=new T.Object3D();muzzle.position.copy(P.muzzle.pos);gun.add(muzzle);const sight=new T.Object3D();sight.position.copy(P.sight.pos);turret.add(sight);
let tow=null,towM=null;if(P.tow){tow=new T.Group();tow.position.copy(P.tow.pos);turret.add(tow);towM=mk('tow',ms.body,'tow');tow.add(towM);tow.userData.y0=tow.position.y}
root.add(wheels,tracks,body);if(band){root.add(band);band.visible=false}scene.add(root);
const t={D,type,team,name,isP,g:root,body,inner,turret,gunPivot,gun,muzzle,sight,tow,wheels,tracks,band,ms,pitch:M.ex.pitch||.1,
hit:[hull,turM,gun,wheels,tracks,band,towM].filter(Boolean),x:0,y:0,z:0,h:0,sp:0,ya:0,el:0,travL:0,travR:0,tp:0,tr:0,om:0,rl0:1,swP:0,swPv:0,swR:0,swRv:0,rec:0,towA:0,
alive:true,deadT:0,crew:D.crew.map(c=>({...c,hp:100,alive:1})),mods:D.mods.map(m=>({...m,max:m.hp})),trk:{L:100,R:100},barrel:1,towOk:1,
am:D.ammo.map(a=>({...a,left:a.n0-(a.belt||0),ready:a.belt||0,rlT:0,rl0:1})),sel:0,loaded:-1,loading:-1,rl:0,cd:0,fire:0,fireT:0,ext:0,extCd:0,repT:0,swapT:0,
thr:0,str:0,ax:0,stats:{k:0,cap:0,dmg:0,score:0,hits:0},hitBy:{},spot:-99,missile:null,lastShot:-9};
t.hit.forEach(m=>m.userData.tank=t);
if(!D.ammo[0].belt){t.am.forEach(a=>{a.left=a.n0});t.am[0].left--;t.loaded=0}
return t}
const crewOf=(t,id)=>t.crew.find(c=>c.id===id),modOf=(t,id)=>t.mods.find(m=>m.id===id);
const crewAlive=t=>t.crew.filter(c=>c.alive).length;
const modOk=(t,id)=>{const m=modOf(t,id);return!m||m.hp>0};
function canDrive(t){return t.alive&&t.trk.L>0&&t.trk.R>0&&modOk(t,'engine')&&modOk(t,'trans')&&crewOf(t,'driver').alive}
function canGun(t){return t.alive&&crewOf(t,'gunner').alive}
function canFire(t){return canGun(t)&&t.barrel>0&&modOk(t,'breech')}

/* ---------- Ortak durum ---------- */
const TANKS=[],SHELLS=[],DEBRIS=[],IND=[],FEED=[],MSG=[];
const G={state:'load',tick:{blue:550,red:550},time:900,pVeh:store.get('veh','abrams'),used:{},player:null,hitcam:null,marker:null,result:null,deathT:0,shake:0,hurt:0,bound:0,deadShown:0,killer:null};
if(!VEH[G.pVeh])G.pVeh='abrams';
const _a=new T.Vector3(),_b=new T.Vector3(),_c=new T.Vector3(),_mp=new T.Vector3(),_md=new T.Vector3(),_inv=new T.Matrix4(),RC=new T.Raycaster();
function note(s,c){MSG.unshift({s,c:c||'#f2c14e',t:3});if(MSG.length>4)MSG.pop()}
const curAm=t=>t.D.ammo[0].belt?t.am[t.sel]:t.am[t.loaded>=0?t.loaded:t.sel];

/* ---------- Sürüş fiziği ---------- */
function drive(t,dt){const D=t.D,mob=canDrive(t);let thr=mob?t.thr:0,str=mob?t.str:0;if(t.repT>0){thr=0;str=0}
const target=thr>0?thr*D.vmax:thr*D.vrev;let a;
if(thr!==0){const dv=target-t.sp;a=(Math.sign(dv)===Math.sign(t.sp)||Math.abs(t.sp)<.4)?Math.sign(dv)*Math.min(Math.abs(dv)/dt,D.acc*(1-.5*Math.abs(t.sp)/D.vmax)):Math.sign(dv)*Math.min(Math.abs(dv)/dt,8.5)}
else a=-Math.sign(t.sp)*Math.min(Math.abs(t.sp)/dt,mob?2.8:5);
if(thr!==0||Math.abs(t.sp)>.6)a-=9.81*Math.sin(t.tp)*.5;
t.ax=lp(t.ax,a,cl(dt*8,0,1));t.sp=cl(t.sp+a*dt,-D.vrev*1.1,D.vmax*1.06);
const om=str*D.turn*(1-.42*Math.min(Math.abs(t.sp)/D.vmax,1))*(t.sp<-.5?-1:1);t.om=lp(t.om,om,cl(dt*5,0,1));
t.h-=t.om*dt;if(canGun(t))t.ya+=t.om*dt;
t.x+=Math.sin(t.h)*t.sp*dt;t.z+=Math.cos(t.h)*t.sp*dt;const hw=D.hw*.85;t.travL+=(t.sp+t.om*hw)*dt;t.travR+=(t.sp-t.om*hw)*dt}
function collide(t){const D=t.D,s=Math.sin(t.h),c=Math.cos(t.h),r=D.hw*.95,L=D.hl-r;
const push=(nx,nz,pen)=>{t.x+=nx*pen;t.z+=nz*pen;const dot=s*nx+c*nz;if(t.sp*dot<0)t.sp*=1-Math.min(1,Math.abs(dot)*1.1)};
for(const k of[-1,0,1]){const cx=t.x+s*(D.cz+k*L),cz=t.z+c*(D.cz+k*L);
gQuery(cx,cz,r+5,o=>{if(!o.alive)return;
if(o.hw){const px=cx-o.x,pz=cz-o.z,lx=px*o.c-pz*o.s,lz=px*o.s+pz*o.c,qx=cl(lx,-o.hw,o.hw),qz=cl(lz,-o.hd,o.hd),ex=lx-qx,ez=lz-qz,d=Math.hypot(ex,ez);
if(d<r){if(o.k==='wall'&&Math.abs(t.sp)>3){breakWall(o);t.sp*=.82;AU.S.thud(t.g.position);return}
let nx,nz,pen;if(d>1e-4){nx=ex/d;nz=ez/d;pen=r-d}else{const ax=o.hw-Math.abs(lx),az=o.hd-Math.abs(lz);if(ax<az){nx=Math.sign(lx)||1;nz=0;pen=ax+r}else{nx=0;nz=Math.sign(lz)||1;pen=az+r}}
push(nx*o.c+nz*o.s,-nx*o.s+nz*o.c,Math.min(pen,2))}return}
const dx=cx-o.x,dz=cz-o.z,d=Math.hypot(dx,dz),rr=r+o.r;if(d>=rr||d<1e-4)return;
if((o.k==='tree'||o.k==='pole')&&Math.abs(t.sp)>1.1){knock(o,s*Math.sign(t.sp),c*Math.sign(t.sp));t.sp*=.9;AU.S.crack(o);return}push(dx/d,dz/d,Math.min(rr-d,2))})}
for(const u of TANKS){if(u===t)continue;const dx=t.x-u.x,dz=t.z-u.z,d=Math.hypot(dx,dz);if(d>D.hl+u.D.hl+2)continue;
const us=Math.sin(u.h),uc=Math.cos(u.h),ur=u.D.hw*.95,uL=u.D.hl-ur;
for(const k of[-1,0,1])for(const j of[-1,0,1]){const ax=t.x+s*(D.cz+k*L),az=t.z+c*(D.cz+k*L),bx=u.x+us*(u.D.cz+j*uL),bz=u.z+uc*(u.D.cz+j*uL),ex=ax-bx,ez=az-bz,e=Math.hypot(ex,ez);
if(e<r+ur&&e>1e-4){const pen=Math.min(r+ur-e,1.5),w=u.alive?u.D.mass/(u.D.mass+D.mass):1;push(ex/e,ez/e,pen*w);if(u.alive){u.x-=ex/e*pen*(1-w);u.z-=ez/e*pen*(1-w)}}}}
const lim=BA+30;t.x=cl(t.x,-lim,lim);t.z=cl(t.z,-lim,lim)}
function place(t,dt){const D=t.D,s=Math.sin(t.h),c=Math.cos(t.h),L=D.hl*.78,Wd=D.hw*.8,ox=t.x+s*D.cz,oz=t.z+c*D.cz,
hf=hAt(ox+s*L,oz+c*L),hb=hAt(ox-s*L,oz-c*L),hr=hAt(ox-c*Wd,oz+s*Wd),hl=hAt(ox+c*Wd,oz-s*Wd),h0=hAt(t.x,t.z),
tp=Math.atan2(hf-hb,2*L),tr=Math.atan2(hl-hr,2*Wd),y=Math.max((hf+hb+hr+hl)/4,h0-.12),k=dt?cl(dt*9,0,1):1;
t.tp=lp(t.tp,tp,k);t.tr=lp(t.tr,tr,k);t.y=dt?lp(t.y,y,cl(dt*14,0,1)):y;
if(dt){const tgP=cl(t.ax*.0075,-.045,.045),tgR=cl(-t.om*t.sp*.0042,-.04,.04);t.swPv+=((tgP-t.swP)*85-t.swPv*6.5)*dt;t.swP+=t.swPv*dt;t.swRv+=((tgR-t.swR)*85-t.swRv*6.5)*dt;t.swR+=t.swRv*dt;
t.rec=Math.max(0,t.rec-dt*(t.rec>.6?2.2:1.6));if(t.tow)t.towA=cl(t.towA+((t.am[t.sel]&&t.am[t.sel].atgm&&t.towOk&&t.alive)?1:-1)*dt*.7,0,1)}
t.g.position.set(t.x,t.y,t.z);t.g.rotation.set(-t.tp,t.h,t.tr,'YXZ');t.body.rotation.set(-t.swP,0,t.swR);
if(t.turret.parent!==scene)t.turret.rotation.y=t.ya;t.gunPivot.rotation.x=-t.el;t.gun.position.z=-ss(t.rec)*(t.type==='abrams'?.55:.14);
if(t.tow){t.tow.rotation.x=-t.towA*.3;t.tow.position.y=t.tow.userData.y0+t.towA*.34}
t.ms.wheel.userData.u.value.set(t.travL,t.travR);const m=x=>((x%t.pitch)+t.pitch)%t.pitch;t.ms.track.userData.u.value.set(m(t.travL),m(t.travR));
if(t.band){const near=cam.position.distanceToSquared(t.g.position)<90*90;t.tracks.visible=near;t.band.visible=!near}
t.g.updateMatrixWorld(true)}

/* ---------- Nişan + ateş ---------- */
function aimAt(t,dt,P){_b.copy(P);t.inner.worldToLocal(_b);const rg=t.turret.position,dx=_b.x-rg.x,dz=_b.z-rg.z,hd=Math.hypot(dx,dz),gp=t.gunPivot.position,a=curAm(t);
const yawT=Math.atan2(dx,dz),rng=Math.max(hd-gp.z,1);let elT=Math.atan2(_b.y-(rg.y+gp.y),rng);if(a&&!a.atgm)elT+=9.81*rng/(2*a.v*a.v)*(1+a.drag*rng/a.v);
const g=canGun(t)?1:0,trav=t.D.trav*(modOk(t,'tdrive')?1:.3)*g,es=t.D.elevSpd*g;
t.ya=wr(t.ya+cl(wr(yawT-t.ya),-trav*dt,trav*dt));const ec=cl(elT,t.D.elev[0],t.D.elev[1]);t.el+=cl(ec-t.el,-es*dt,es*dt);
return Math.abs(wr(yawT-t.ya))+Math.abs(ec-t.el)}
function gunRay(t,p,d){t.muzzle.getWorldPosition(p);d.set(0,0,1).transformDirection(t.gun.matrixWorld)}
function startLoad(t){let i=t.sel;if(t.am[i].left<=0)i=t.am.findIndex(a=>a.left>0);if(i<0){t.loading=-1;return}
t.am[i].left--;t.loading=i;t.rl=t.D.rld*(crewOf(t,'loader').alive?1:1.45)*(G.mode==='ab'?.75:1);t.rl0=t.rl}
function ammoTick(t,dt){t.cd=Math.max(0,t.cd-dt);t.swapT=Math.max(0,t.swapT-dt);if(!t.alive)return;
if(!t.D.ammo[0].belt){if(t.loaded<0&&t.loading<0)startLoad(t);if(t.loading>=0&&t.rl>0){t.rl-=dt*(crewAlive(t)>1?1:.5);if(t.rl<=0){t.rl=0;t.loaded=t.loading;t.loading=-1;if(t.isP){AU.S.load();VOICE.say('Hazır!')}}}return}
for(const a of t.am){if(a.rlT>0){a.rlT-=dt;if(a.rlT<=0){const n=Math.min(a.belt,a.left);a.ready=n;a.left-=n;a.rlT=0;if(t.isP){AU.S.load();VOICE.say(a.atgm?'Füze hazır!':'Şerit takıldı!')}}}
else if(a.ready<=0&&a.left>0){a.rlT=(a.atgm?15:8)*(G.mode==='ab'?.7:1);a.rl0=a.rlT}}}
function quickReload(t){if(t.D.ammo[0].belt||!t.alive)return;if(t.loaded>=0&&t.loaded!==t.sel&&t.am[t.sel].left>0){t.am[t.loaded].left++;t.loaded=-1;startLoad(t);note('Hızlı doldurma: '+t.am[t.sel].k)}}
function tryFire(t){if(!canFire(t))return false;
if(!t.D.ammo[0].belt){if(t.loaded<0||t.rl>0)return false;const a=t.am[t.loaded];t.loaded=-1;launch(t,a);startLoad(t);return true}
const a=t.am[t.sel];if(t.swapT>0||t.cd>0||a.ready<=0||a.rlT>0)return false;
if(a.atgm){if(!t.towOk){if(t.isP&&clock.t-(t.twn||0)>2){t.twn=clock.t;note('TOW rampası hasarlı','#ff6a50')}return false}if(t.towA<1)return false;
if(Math.abs(t.sp)>1.5){if(t.isP&&clock.t-(t.twn||0)>2){t.twn=clock.t;note('TOW: ateşlemek için dur!')}return false}if(t.missile&&t.missile.alive)return false}
a.ready--;t.cd=a.atgm?1.5:a.auto;launch(t,a);return true}
function launch(t,a){gunRay(t,_mp,_md);const p=_mp.clone(),d=_md.clone();
if(a.atgm){t.tow.getWorldPosition(p);_c.set(0,.25,.6).applyQuaternion(t.turret.getWorldQuaternion(new T.Quaternion()));p.add(_c)}
const disp=(a.cal>100?.00022:a.atgm?0:.0009)+(Math.abs(t.sp)>1?.0014:0);d.x+=RV(-1,1)*disp;d.y+=RV(-1,1)*disp;d.z+=RV(-1,1)*disp;d.normalize();
spawnShell(t,a,p,d);t.lastShot=clock.t;
const big=a.cal>100&&!a.atgm;if(!a.atgm)t.rec=1;const im=big?.55:.05;t.swPv+=Math.cos(t.ya)*im;t.swRv-=Math.sin(t.ya)*im*.6;
muzzleFx(p,d,big,a.atgm?'atgm':'');if(big){const gy=hAt(p.x,p.z);for(let i=0;i<8;i++){const an=RV(0,6.28),r=RV(1,5);fxP(SMK,p.x+Math.cos(an)*r,gy+.4,p.z+Math.sin(an)*r,Math.cos(an)*RV(3,8),RV(.5,2),Math.sin(an)*RV(3,8),RV(1.5,3),1,5,DUSTC,.35,0,1.2)}}
if(a.atgm)AU.S.atgm(p);else if(big)AU.S.cannon(p,true);else AU.S.auto(p);if(t.isP)G.shake=Math.max(G.shake,big?.7:.12)}

/* ---------- Mermiler ---------- */
const trG=new T.CylinderGeometry(.05,.05,1,5,1,true);trG.rotateX(Math.PI/2);const trMats={};
const misG=(()=>{const g=new T.CylinderGeometry(.075,.075,1.15,8);g.rotateX(Math.PI/2);return g})(),misM=new T.MeshStandardMaterial({color:0x5a5f52,roughness:.6,metalness:.3});
function spawnShell(t,a,p,d){const s={t,a,team:t.team,p,v:d.clone().multiplyScalar(a.atgm?55:a.v),life:a.atgm?19:5,pl:0,ign:t,ignT:.4,alive:1,dist:0,age:0};
if(a.atgm){s.mesh=new T.Mesh(misG,misM);s.mesh.castShadow=true;t.missile=s}
else{if(!trMats[a.id])trMats[a.id]=new T.MeshBasicMaterial({color:new T.Color(...a.col),fog:false,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false});s.mesh=new T.Mesh(trG,trMats[a.id]);s.mesh.frustumCulled=false}
s.mesh.position.copy(p);scene.add(s.mesh);SHELLS.push(s);return s}
function guide(s,h){const t=s.t,a=s.a;s.age+=h;let tp=null;
if(t.alive&&canGun(t)){if(t.isP&&AIM.ok){tp=_c.copy(AIM.o).addScaledVector(AIM.d,s.p.distanceTo(AIM.o)+45)}
else if(t.ai&&t.ai.tgt&&t.ai.tgt.alive){const u=t.ai.tgt;tp=_c.set(u.x,u.y+1.4,u.z).add(t.ai.terr)}}
const spd=Math.min(a.v,55+s.age*320),dir=_b.copy(s.v).normalize();
if(tp&&s.age>.25){_a.copy(tp).sub(s.p).normalize();const ang=dir.angleTo(_a),mx=1.5*h;if(ang>1e-4)dir.lerp(_a,Math.min(1,mx/ang)).normalize()}
dir.x+=Math.sin(s.age*13)*.003;dir.y+=Math.cos(s.age*11)*.003;dir.normalize();s.v.copy(dir).multiplyScalar(spd);if(!tp)s.v.y-=2*h}
function stepShell(s,h){const a=s.a;if(s.ignT>0)s.ignT-=h;
if(a.atgm)guide(s,h);else{s.v.y-=9.81*h;s.v.multiplyScalar(1-a.drag*h)}
const sp=s.v.length();if(!(sp>1)){kill(s);return}const len=sp*h,d=_md.copy(s.v).divideScalar(sp),P=s.p;let best=len,hit=null;
for(const t of TANKS){if(t===s.ign&&s.ignT>0)continue;const qx=t.x-P.x,qy=t.y+1.5-P.y,qz=t.z-P.z,k=cl(qx*d.x+qy*d.y+qz*d.z,0,best),ex=qx-d.x*k,ey=qy-d.y*k,ez=qz-d.z*k;
if(ex*ex+ey*ey+ez*ez>81)continue;RC.set(P,d);RC.near=0;RC.far=best;const r=RC.intersectObjects(t.hit,false);if(r.length&&r[0].distance<best){best=r[0].distance;hit={k:'tank',t,r:r[0]}}}
for(const pl of PLANES){if(!pl.alive||pl===s.t||pl.team===s.team)continue;const qx=pl.p.x-P.x,qy=pl.p.y-P.y,qz=pl.p.z-P.z,k=cl(qx*d.x+qy*d.y+qz*d.z,0,best),ex=qx-d.x*k,ey=qy-d.y*k,ez=qz-d.z*k;
if(ex*ex+ey*ey+ez*ez>110)continue;const r=planeRay(pl,P,d,best);if(r&&r.t<best){best=r.t;hit={k:'plane',pl,part:r.part}}}
const tg=segTerrain(P.x,P.y,P.z,d.x,d.y,d.z,best,2.5);if(tg>=0&&tg<best){best=tg;hit={k:'ground'}}
const ob=segObs(P.x,P.y,P.z,d.x,d.y,d.z,best);if(ob&&ob.t<best){best=ob.t;hit={k:'ob',ob}}
if(!hit){P.addScaledVector(d,len);s.dist+=len;s.life-=h;if(s.life<=0||Math.abs(P.x)>W||Math.abs(P.z)>W||P.y<-60)kill(s);
if((a.atgm||a.rocket)&&Math.random()<h*40){fxP(SMK,P.x,P.y,P.z,RV(-.4,.4),RV(-.2,.4),RV(-.4,.4),RV(1.6,3),.35,2.2,[.66,.65,.62],.35,-.1,1.5);fxP(ADD,P.x,P.y,P.z,0,0,0,.05,.9,.5,[7,4.5,2],1,0,0,1,0)}
if(!a.atgm&&!s.t.isP&&G.player&&G.player.alive&&s.dist>40&&!s.cracked){const pl=G.player;if(Math.hypot(pl.x-P.x,pl.y+2-P.y,pl.z-P.z)<14){s.cracked=1;AU.S.crack(P)}}return}
P.addScaledVector(d,best);onHit(s,hit,d,sp)}
function kill(s){s.alive=0;if(s.mesh.parent)scene.remove(s.mesh);if(s.t.missile===s)s.t.missile=null}
function updShells(dt){for(let i=SHELLS.length-1;i>=0;i--){const s=SHELLS[i];let rem=dt,n=0;while(rem>0&&s.alive&&n++<10){const h=Math.min(rem,.02);rem-=h;stepShell(s,h)}
if(!s.alive){SHELLS.splice(i,1);continue}
const sp=s.v.length();s.mesh.position.copy(s.p);_a.copy(s.p).add(s.v);s.mesh.lookAt(_a);if(!s.a.atgm){const L=cl(sp*.022,2,22),w=s.a.cal>50?1.6:1;s.mesh.scale.set(w,w,L);s.mesh.position.addScaledVector(s.v,-.5*L/sp)}}}
function splash(P,a,s){const r=a.atgm?5:a.cal>100?4:1.4;for(const t of TANKS){if(!t.alive||t.team===s.team)continue;const d=Math.hypot(t.x-P.x,t.z-P.z);if(d>r+t.D.hl)continue;
const c=Math.random();if(d<r+t.D.hw&&c<.35){const side=((P.x-t.x)*Math.cos(t.h)-(P.z-t.z)*Math.sin(t.h))>0?'L':'R';t.trk[side]=Math.max(0,t.trk[side]-(a.cal>100?60:20));if(t.isP&&t.trk[side]<=0)note('Palet koptu!','#ff6a50')}
else if(c<.45&&a.cal>100){t.barrel=Math.max(0,t.barrel-.5)}}}
function onHit(s,h,d,sp){const P=s.p,a=s.a,ex=a.he||a.heat,big=a.cal>40;
if(h.k==='plane'){planeHit(s,h.pl,h.part,P);kill(s);return}
if(h.k==='ground'){const n=nAt(P.x,P.z);impactFx(P.x,P.y,P.z,n.x,n.y,n.z,ex?'expl':'ground',big);if(ex)AU.S.boom(P,a.atgm?.9:big?.6:.25);else AU.S.thud(P);if(ex)splash(P,a,s);kill(s);return}
if(h.k==='ob'){const o=h.ob.o,nx=h.ob.nx,nz=h.ob.nz;
if((o.k==='tree'||o.k==='pole')&&big){knock(o,d.x,d.z);impactFx(P.x,P.y,P.z,nx,0,nz,'wood',1);if(!ex){P.addScaledVector(d,.6);return}}
if(o.k==='wall'&&big){breakWall(o);if(!ex){P.addScaledVector(d,.8);s.pl+=30;return}}
impactFx(P.x,P.y,P.z,nx,0,nz,ex?'expl':o.k==='bld'||o.k==='wall'?'bld':o.k==='rock'?'ground':'wood',big);if(ex){AU.S.boom(P,big?.6:.25);splash(P,a,s)}else AU.S.thud(P);kill(s);return}
tankHit(s,h.t,h.r,d,sp)}

/* ---------- Zırh delme + hasar modeli ---------- */
function tankHit(s,t,r,d,sp){const a=s.a,sh=s.t,part=r.object.userData.part,P=r.point;
_inv.copy(r.object.matrixWorld).invert();const lpnt=P.clone().applyMatrix4(_inv),ln=r.face.normal.clone(),nW=ln.clone().transformDirection(r.object.matrixWorld);
if(nW.dot(d)>0){nW.negate();ln.negate()}const cosA=cl(-nW.dot(d),.02,1),ang=Math.acos(cosA)/DEG,Z=t.D.armor(part,lpnt,ln),heat=a.heat||a.atgm;
const iv=new T.Matrix4().copy(t.inner.matrixWorld).invert();
const R={sh,t,part,zone:Z.n,ang,pen:0,eff:0,res:'',items:[],crewK:0,kill:0,ep:P.clone().applyMatrix4(iv),ed:d.clone().transformDirection(iv),am:a};
if(t.team===s.team){impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,heat?'expl':'metal',a.cal>40);kill(s);return}
const pen=heat?a.pen-s.pl*3:a.pen*Math.pow(sp/a.v,1.35)-s.pl;R.pen=Math.max(0,pen);
if(t.alive)t.hitBy[sh.name]=clock.t;
if(Z.track){const side=lpnt.x>0?'L':'R',dm=heat||a.he?100:a.cal>50?70:28;if(t.alive){t.trk[side]=Math.max(0,t.trk[side]-dm);R.items.push([side==='L'?'Sol palet':'Sağ palet',t.trk[side]/100])}
if(heat||a.he||!t.alive){impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,heat||a.he?'expl':'metal',a.cal>40);if(heat)AU.S.boom(P,.5);if(t.alive){R.res='track';report(R)}kill(s);return}
impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,'metal',a.cal>40);s.pl+=Z.t+(a.cal<40?12:0);s.ign=null;P.addScaledVector(d,.06);if(a.cal<40&&t.trk[side]<=0){R.res='track';report(R)}return}
if(!t.alive){impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,heat?'expl':'metal',a.cal>40);kill(s);return}
if(Z.barrel){t.barrel=a.cal>40||heat?0:Math.max(0,t.barrel-.34);R.items.push(['Namlu',t.barrel]);R.res='barrel';impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,heat?'expl':'metal',a.cal>40);AU.S.clang(P,0);report(R);kill(s);return}
if(Z.tow){t.towOk=0;R.items.push(['TOW rampası',0]);R.res='barrel';impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,'metal',1);report(R);kill(s);return}
const rth=heat?(a.atgm?86:81):a.k==='APFSDS'?(a.cal<40?74:79):70;
if(ang>rth&&Math.random()<.25+ss((ang-rth)/7)*.75){s.v.reflect(nW).multiplyScalar(heat?.25:.62);s.ign=t;s.ignT=.12;P.addScaledVector(nW,.06);
impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,'ric');AU.S.ric(P);R.res='ric';report(R);if(heat)kill(s);return}
const eff=Z.c?Z.t/Math.pow(cosA,.4):Z.t/Math.max(cosA,.08);R.eff=eff;
if(pen<eff){R.res='nopen';impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,heat||a.he?'expl':'metal',a.cal>40);AU.S.clang(P,0);
if(a.he&&a.cal<40&&Math.random()<.15){const m=modOf(t,'tdrive');if(m)m.hp=Math.max(0,m.hp-15)}report(R);kill(s);return}
R.res='pen';impactFx(P.x,P.y,P.z,nW.x,nW.y,nW.z,'pen',a.cal>40);AU.S.clang(P,1);spall(t,R.ep,R.ed,a,pen-eff,R,sh);kill(s);report(R)}
function rayBox(ox,oy,oz,dx,dy,dz,c,sz){let t0=0,t1=1e9;const o=[ox,oy,oz],dd=[dx,dy,dz];for(let k=0;k<3;k++){const h=sz[k]/2,lo=c[k]-h,hi=c[k]+h;
if(Math.abs(dd[k])<1e-9){if(o[k]<lo||o[k]>hi)return-1;continue}let a=(lo-o[k])/dd[k],b=(hi-o[k])/dd[k];if(a>b){const q=a;a=b;b=q}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1)return-1}return t0}
function spall(t,ep,ed,a,over,R,sh){const[n,dmg,cone,len]=a.spall,rays=[{d:ed.clone(),dm:a.core*(1+Math.min(over/400,.4)),l:len*1.25}];
for(let i=0;i<n;i++){const u=new T.Vector3(RV(-1,1),RV(-1,1),RV(-1,1)).cross(ed).normalize(),an=RV(.15,1)*cone*DEG;rays.push({d:ed.clone().multiplyScalar(Math.cos(an)).addScaledVector(u,Math.sin(an)).normalize(),dm:dmg*RV(.7,1.25),l:len*RV(.6,1)})}
const rg=t.turret.position,c=Math.cos(t.ya),s=Math.sin(t.ya),boxes=[...t.crew.map(x=>({o:x,cr:1})),...t.mods.map(x=>({o:x}))];
for(const ry of rays){const hits=[];for(const b of boxes){const o=b.o;if(b.cr&&!o.alive)continue;let ox=ep.x,oy=ep.y,oz=ep.z,dx=ry.d.x,dy=ry.d.y,dz=ry.d.z;
if(o.t){const px=ox-rg.x,pz=oz-rg.z;ox=px*c-pz*s;oz=px*s+pz*c;oy-=rg.y;const qx=dx*c-dz*s,qz=dx*s+dz*c;dx=qx;dz=qz}
const tt=rayBox(ox,oy,oz,dx,dy,dz,o.c,o.s);if(tt>=0&&tt<ry.l)hits.push([tt,b])}
hits.sort((x,y)=>x[0]-y[0]);let rem=ry.dm;for(const[tt,b]of hits){dmgMod(t,b,rem*(1-tt/ry.l*.5),R);rem*=.62;if(rem<5)break}}
if((a.he&&a.cal>40)||a.atgm){const k=t.type==='bradley'?1:.45;t.crew.forEach(x=>{if(x.alive&&Math.random()<.8)dmgMod(t,{o:x,cr:1},RV(35,95)*k,R)})}
if(R.ammoDet){destroyTank(t,sh,'ammo');R.kill=1}else if(crewAlive(t)<=1){destroyTank(t,sh,'crew');R.kill=1}else if(R.fire&&!t.fire)startFire(t,sh)}
function dmgMod(t,b,dm,R){const o=b.o;if(b.cr){if(!o.alive)return;o.hp-=dm;if(o.hp<=0){o.hp=0;o.alive=0;R.crewK++}R.items.push([o.n,o.hp/100,1]);return}
if(o.hp<=0&&!o.ammo)return;o.hp=Math.max(0,o.hp-dm);R.items.push([o.n,o.hp/o.max]);
if(o.ammo&&!o.det&&(o.hp<=0||Math.random()<dm/260)){o.det=1;if(o.blow)R.blow=1;else R.ammoDet=1}
if(o.fuel&&Math.random()<.35)R.fire=1;if(o.id==='engine'&&o.hp<=0&&Math.random()<.3)R.fire=1;
if(R.blow&&!t.blown){t.blown=1;t.am.forEach(a=>a.left=Math.floor(a.left*.35));const p=t.turret.getWorldPosition(new T.Vector3());
for(let i=0;i<26;i++)fxP(ADD,p.x+RV(-.6,.6),p.y+1,p.z+RV(-.6,.6),RV(-1.5,1.5),RV(8,16),RV(-1.5,1.5),RV(.6,1.4),1.5,3.5,FIRE,1,2,.8,0);AU.S.boom(p,.7);if(t.isP)note('Taret mühimmatı infilak etti — patlama panelleri mürettebatı korudu','#ff9a50')}}
function startFire(t,by){t.fire=1;t.fireT=0;t.fireBy=by;if(t.isP){note('YANGIN! [F] ile söndür','#ff6a50');VOICE.say('Yangın var!',1)}}
function destroyTank(t,killer,cause){if(!t.alive)return;t.alive=false;t.deadT=0;t.thr=t.str=0;t.fire=0;t.repT=0;t.burn=RV(45,80);t.cause=cause;
t.ms.all.forEach(m=>{m.color.setRGB(.12,.11,.1);m.envMapIntensity=.25});const p=t.g.position;
boom(p.x,p.y+1.6,p.z,cause==='ammo'?2.3:1.2,1);AU.S.boom(p,cause==='ammo'?1.4:.9);
if(cause==='ammo'){scene.attach(t.turret);DEBRIS.push({o:t.turret,v:new T.Vector3(RV(-4,4),RV(10,16),RV(-4,4)),w:new T.Vector3(RV(-2.5,2.5),RV(-1.5,1.5),RV(-2.5,2.5))})}
if(killer&&killer!==t){killer.stats.k++;const sc=t.type==='abrams'?220:170;killer.stats.score+=sc;addSP(killer,SPV.kill);if(killer.isP){G.marker={s:'HEDEF İMHA EDİLDİ',c:'#ff5a4a',t:2.6};note(`+${sc} puan · +${SPV.kill} SP  ${t.D.short} imha edildi`,'#f2c14e');VOICE.say('Hedef imha edildi!',1)}}
for(const n in t.hitBy){const u=[...TANKS,...PLANES].find(x=>x.name===n&&x.alive);if(u&&u!==killer&&clock.t-t.hitBy[n]<30){u.stats.score+=60;addSP(u,SPV.assist);if(u.isP)note('+60 puan · +'+SPV.assist+' SP  Asist')}}
FEED.unshift({a:killer&&killer!==t?killer:null,v:t,how:cause==='ammo'?'💥':cause==='fire'?'🔥':'',t:8});if(FEED.length>6)FEED.pop();
G.tick[t.team]=Math.max(0,G.tick[t.team]-20);if(t.isP)playerDied(killer)}
function report(R){if(R.sh.isP){const M={ric:['SEKME','#d9d2b8'],nopen:['DELİNMEDİ','#d9d2b8'],pen:['DELİNDİ','#f2c14e'],track:['PALET HASARI','#f2c14e'],barrel:['DIŞ MODÜL HASARI','#f2c14e']}[R.res];
if(!R.kill&&M){let s=M[0];if(R.res==='pen'&&(R.crewK||R.items.some(i=>i[1]<=0)))s='KRİTİK HASAR';G.marker={s,c:R.res==='pen'?'#f2c14e':M[1],t:2}}
G.hitcam={...R,time:clock.t,crew:R.t.crew.map(c=>({...c})),mods:R.t.mods.map(m=>({...m})),trk:{...R.t.trk},barrel:R.t.barrel,ya:R.t.ya};if(R.res==='pen'){R.sh.stats.score+=R.kill?0:25;R.sh.stats.hits++;if(!R.kill)addSP(R.sh,SPV.pen)}
if(!R.kill)VOICE.say({ric:'Sekti!',nopen:'Delemedi!',pen:R.crewK?'Kritik isabet!':'Delindi!',track:'Paleti koptu!',barrel:'Topu hasarlı!'}[R.res]||'İsabet!')}
if(R.t.isP){G.hurt=Math.max(G.hurt,R.res==='pen'?1:.35);G.shake=Math.max(G.shake,R.res==='pen'?.8:.4);IND.push({x:R.sh.x,z:R.sh.z,t:2.2});
if(R.res==='pen')VOICE.say('Vurulduk!',1);if(R.res==='ric')note('Sekme!','#d9d2b8');else if(R.res==='nopen')note('Zırh delinmedi','#d9d2b8');else if(R.res==='pen'&&R.t.alive){const k=R.items.filter(i=>i[2]&&i[1]<=0).map(i=>i[0]);note(k.length?k.join(', ')+' öldü':'Zırh delindi!','#ff6a50')}}}

/* ---------- Tank döngüsü: yangın, onarım, mürettebat, efektler ---------- */
function repairAll(t){t.trk.L=Math.max(t.trk.L,60);t.trk.R=Math.max(t.trk.R,60);t.mods.forEach(m=>{if(m.hp<m.max*.5&&!(m.ammo&&m.det))m.hp=m.max*.5});t.barrel=1;t.towOk=1}
function needsRepair(t){return t.trk.L<=0||t.trk.R<=0||t.barrel<=0||!t.towOk||t.mods.some(m=>m.hp<=0&&!m.ammo)}
function crewSwap(t,dt){for(const role of['gunner','driver']){const c=crewOf(t,role);if(c.alive)continue;const dn=t.crew.find(x=>x.alive&&(x.id==='loader'||x.id==='commander'));if(!dn){c.sw=0;continue}
c.sw=(c.sw||0)+dt;if(c.sw>5){c.alive=1;c.hp=dn.hp;dn.alive=0;dn.hp=0;dn.moved=1;c.sw=0;if(t.isP)note(`${dn.n}, ${c.n.toLowerCase()} koltuğuna geçti`,'#d9d2b8')}}}
function tankTick(t,dt){const d2=cam.position.distanceToSquared(t.g.position),near=d2<260*260;
if(!t.alive){t.deadT+=dt;if(t.burn>0){t.burn-=dt;const r=near?1:.3;t.inner.localToWorld(_c.set(0,2,t.D.cz));
if(Math.random()<dt*10*r)fxP(SMK,_c.x+RV(-.8,.8),_c.y,_c.z+RV(-.8,.8),RV(-.4,.4),RV(2.5,4.5),RV(-.4,.4),RV(4,8),1.4,7.5,SMOKE,.55,-.25,.25);
if(t.burn>15&&Math.random()<dt*18*r)fxP(ADD,_c.x+RV(-1,1),_c.y-.4,_c.z+RV(-1,1),RV(-.3,.3),RV(1.5,3),RV(-.3,.3),RV(.4,.8),1.2,.5,FIRE,1,-1,.5,0)}return}
crewSwap(t,dt);
if(t.fire){t.fireT+=dt;const em=modOf(t,'engine');em.hp=Math.max(0,em.hp-dt*3);t.inner.localToWorld(_c.set(0,2,t.type==='abrams'?-2.5:1.4));
if(Math.random()<dt*24)fxP(ADD,_c.x+RV(-.7,.7),_c.y,_c.z+RV(-.7,.7),RV(-.5,.5),RV(1.5,3.5),RV(-.5,.5),RV(.3,.7),1,.4,FIRE,1,-1,.4,0);
if(Math.random()<dt*8)fxP(SMK,_c.x,_c.y+.6,_c.z,RV(-.4,.4),RV(2,4),RV(-.4,.4),RV(3,6),1.2,5,SMOKE,.5,-.3,.3);
if(Math.random()<dt*1.1){const al=t.crew.filter(c=>c.alive);if(al.length){const c=pick(al);c.hp-=RV(7,13);if(c.hp<=0){c.hp=0;c.alive=0;if(t.isP)note(c.n+' yangında öldü','#ff6a50')}}}
if(crewAlive(t)<=1){destroyTank(t,t.fireBy,'fire');return}
if(t.ext>0){t.ext-=dt;if(t.ext<=0){t.fire=0;if(t.isP)note('Yangın söndürüldü','#7fe08a')}}if(t.fireT>30)t.fire=0}
if(t.extCd>0)t.extCd-=dt;
if(t.repT>0){if(Math.abs(t.sp)>.7||t.fire){t.repT=0;if(t.isP)note('Onarım iptal edildi','#d9d2b8')}else{t.repT+=dt;if(t.repT>=t.D.repair*(G.mode==='ab'?.6:1)){repairAll(t);t.repT=0;if(t.isP)note('Onarım tamamlandı','#7fe08a')}}}
if(!near)return;const s=Math.sin(t.h),c=Math.cos(t.h),as=Math.abs(t.sp);
if(as>3&&d2<150*150&&Math.random()<dt*as*(Q.hi?.9:.45)){const sg=Math.random()<.5?-1:1,off=t.D.hw-.4,bx=t.x-s*(t.D.hl-.6-t.D.cz)+c*off*sg,bz=t.z-c*(t.D.hl-.6-t.D.cz)-s*off*sg;
fxP(SMK,bx,hAt(bx,bz)+.3,bz,-s*t.sp*.15+RV(-.6,.6),RV(.4,1.4),-c*t.sp*.15+RV(-.6,.6),RV(1.4,2.6),.9,3+as*.1,DUSTC,.2+as*.007,0,.8)}
if(t.type==='bradley'&&t.thr>.2&&t.ax>.3&&Math.random()<dt*7){t.inner.localToWorld(_c.set(-1.05,2.05,1.05));fxP(SMK,_c.x,_c.y,_c.z,RV(-.3,.3),RV(1,2),RV(-.3,.3),RV(1,2),.5,2.2,[.12,.115,.11],.3,-.3,.8)}
if(!t.mk)t.mk={x:t.x,z:t.z,s,c,v:0};const m=t.mk,d=Math.hypot(t.x-m.x,t.z-m.z);
if(d>=.9){if(d<6){const off=t.D.hw-.38,hwd=.34;for(const sg of[1,-1]){const nx=t.x+c*off*sg,nz=t.z-s*off*sg,px=m.x+m.c*off*sg,pz=m.z-m.s*off*sg;
MARK.add(px+m.c*hwd,pz-m.s*hwd,px-m.c*hwd,pz+m.s*hwd,nx+c*hwd,nz-s*hwd,nx-c*hwd,nz+s*hwd,m.v,m.v+d/1.1)}m.v+=d/1.1}m.x=t.x;m.z=t.z;m.s=s;m.c=c}}
function updDebris(dt){for(const d of DEBRIS){if(d.done)continue;d.v.y-=9.81*dt;d.o.position.addScaledVector(d.v,dt);d.o.rotation.x+=d.w.x*dt;d.o.rotation.y+=d.w.y*dt;d.o.rotation.z+=d.w.z*dt;
if(Math.random()<dt*25)fxP(SMK,d.o.position.x,d.o.position.y,d.o.position.z,0,0,0,RV(1.5,3),.8,3,SMOKE,.5,-.2,.5);
const g=hAt(d.o.position.x,d.o.position.z)+.4;if(d.o.position.y<g&&d.v.y<0){d.o.position.y=g;if(Math.abs(d.v.y)>4){d.v.y*=-.25;d.v.x*=.4;d.v.z*=.4;d.w.multiplyScalar(.3);dustAt(d.o.position.x,g,d.o.position.z,8,1.5);AU.S.thud(d.o.position)}else d.done=1}}}

/* ---------- Yapay zekâ ---------- */
const NAMES={blue:['Kartal','Bozkurt','Şahin','Atmaca','Doğan'],red:['Akrep','Engerek','Çakal','Sırtlan','Kobra']};
function newAI(t,i){t.ai={i,th:RV(0,.35),tgt:null,vis:new Map(),goal:null,gx:t.x,gz:t.z,rep:0,stuck:0,rev:0,rs:1,hold:0,settle:0,err:new T.Vector3(),errT:0,terr:new T.Vector3(),
burst:0,pause:0,react:RV(1.2,2.4),ang:RV(.25,.5)*(Math.random()<.5?-1:1),spot:[0,1.25,0],moveT:0,lost:0,extAt:RV(3,7),wh:t.h}}
function boxNear(o,x,z,r){const px=x-o.x,pz=z-o.z,lx=px*o.c-pz*o.s,lz=px*o.s+pz*o.c;return Math.hypot(lx-cl(lx,-o.hw,o.hw),lz-cl(lz,-o.hd,o.hd))<r}
function probe(t,a){let c=0;const h0=hAt(t.x,t.z);for(const ds of[7,14,22]){const x=t.x+Math.sin(a)*ds,z=t.z+Math.cos(a)*ds;if(Math.abs(x)>BA-8||Math.abs(z)>BA-8)c+=2;
if(Math.abs(hAt(x,z)-h0)>ds*.42)c+=1;gQuery(x,z,t.D.hw+3,o=>{if(!o.alive)return;if(o.hw){if(boxNear(o,x,z,t.D.hw+1.2))c+=o.k==='wall'?.4:1.2}else if(o.k==='rock'&&o.r>1.2&&Math.hypot(o.x-x,o.z-z)<o.r+t.D.hw+.8)c+=1});
for(const u of TANKS)if(u!==t&&Math.hypot(u.x-x,u.z-z)<u.D.hl+2.5)c+=u.alive?.6:1.2}return c}
function steer(t,gx,gz){const des=Math.atan2(gx-t.x,gz-t.z);let ba=des,bs=-1e9;for(const off of[0,.35,-.35,.7,-.7,1.1,-1.1,1.6,-1.6,2.3,-2.3]){const sc=-Math.abs(off)*1.1-probe(t,des+off)*4;if(sc>bs){bs=sc;ba=des+off}}return ba}
const ownCap=(c,tm)=>c.owner===tm&&c.v*(tm==='blue'?1:-1)>=.99;
function aiThink(t){const A=t.ai,rng=t.type==='abrams'?820:700;let best=null,bs=1e9;
for(const u of TANKS){if(!u.alive||u.team===t.team)continue;const d=Math.hypot(u.x-t.x,u.z-t.z);if(d>rng){A.vis.set(u,0);continue}
const v=losClear(t.x,t.y+2.6,t.z,u.x,u.y+1.7,u.z);A.vis.set(u,v?(A.vis.get(u)||0)+.35:0);if(!v)continue;if(t.team==='blue')u.spot=clock.t;
let sc=d;if(u===A.tgt)sc*=.65;if(u.isP)sc*=.85;if(clock.t-u.lastShot<3)sc*=.8;if(t.type==='bradley'&&u.type==='abrams'&&!(t.am[2].ready>0&&t.towOk))sc*=1.6;if(sc<bs){bs=sc;best=u}}
A.air=null;if(t.type==='bradley'){let bd=1700;for(const pl of PLANES){if(!pl.alive||pl.team===t.team)continue;const d=pl.p.distanceTo(t.g.position);if(d<bd&&losClear(t.x,t.y+2.6,t.z,pl.p.x,pl.p.y,pl.p.z)){bd=d;A.air=pl}}}
if(best!==A.tgt){A.tgt=best;A.settle=0;A.spot=pick([[0,1.25,0],[0,1.3,.4],[0,2.1,.5],[0,.75,1]]);A.lost=0}
if(!A.goal||clock.t>A.rep||(ownCap(A.goal,t.team)&&CAPS.some(c=>!ownCap(c,t.team)))){const cand=CAPS.filter(c=>!ownCap(c,t.team)),L=cand.length?cand:CAPS;
const srt=[...L].sort((a,b)=>Math.hypot(a.x-t.x,a.z-t.z)-Math.hypot(b.x-t.x,b.z-t.z));A.goal=Math.random()<.55?srt[0]:srt[(A.i+1)%srt.length];
const an=RV(0,6.28),rr=RV(0,.55)*A.goal.r;A.gx=A.goal.x+Math.cos(an)*rr;A.gz=A.goal.z+Math.sin(an)*rr;A.rep=clock.t+RV(25,45)}
A.wh=steer(t,A.gx,A.gz)}
function aiTick(t,dt){const A=t.ai;if(!A.goal)aiThink(t);A.th-=dt;if(A.th<=0){A.th=.35;aiThink(t)}
if(t.fire&&t.fireT>A.extAt&&!(t.ext>0))t.ext=1.5;
const u=A.tgt&&A.tgt.alive?A.tgt:null,seen=!!(u&&A.vis.get(u)>0),d=u?Math.hypot(u.x-t.x,u.z-t.z):1e9;
if(needsRepair(t)&&!(t.repT>0)&&Math.abs(t.sp)<.6&&(!seen||!canDrive(t)))t.repT=.001;
let thr=0,str=0;const dG=Math.hypot(A.gx-t.x,A.gz-t.z);
const tow=t.type==='bradley'&&t.am[2].ready>0&&t.towOk&&!(t.am[2].rlT>0);
if(t.type==='bradley')t.sel=seen&&u.type==='abrams'&&tow?2:0;
else{const want=seen&&u.type==='bradley'?1:0;if(t.sel!==want&&t.am[want].left>0)t.sel=want}
const goTo=()=>{const dh=wr(A.wh-t.h);str=cl(-dh*1.8,-1,1);thr=Math.abs(dh)>1.1?.15:Math.abs(dh)>.6?.45:dG<40?.6:1};
if(seen){A.lost=0;A.hold+=dt;const fh=Math.atan2(u.x-t.x,u.z-t.z)+(t.type==='abrams'?A.ang:0);
if(t.type==='bradley'&&u.type==='abrams'&&d<330&&!tow){const dh=wr(Math.atan2(u.x-t.x,u.z-t.z)-t.h);str=cl(-dh*1.6,-1,1);thr=-.9}
else if((t.type==='bradley'&&t.sel===2)||A.hold<14||d<180){const dh=wr(fh-t.h);str=Math.abs(dh)>.12?cl(-dh*1.6,-1,1):0;thr=d<70?-.5:0;if(Math.abs(dh)>.9)thr=0}
else{if(dG>12)goTo();if(A.hold>22)A.hold=0}}
else{A.hold=Math.max(0,A.hold-dt*2);A.lost+=dt;if(dG>A.goal.r*.42)goTo();
else{A.moveT+=dt;if(A.moveT>20){A.moveT=RV(-10,0);const an=RV(0,6.28),rr=RV(.1,.5)*A.goal.r;A.gx=A.goal.x+Math.cos(an)*rr;A.gz=A.goal.z+Math.sin(an)*rr}}}
if(t.sel===2&&seen)thr=0;
if(A.rev>0){A.rev-=dt;thr=-.85;str=A.rs}else if(thr>.3&&Math.abs(t.sp)<.5&&canDrive(t)){A.stuck+=dt;if(A.stuck>2.2){A.stuck=0;A.rev=RV(1.2,2);A.rs=Math.random()<.5?-1:1}}else A.stuck=Math.max(0,A.stuck-dt);
t.thr=thr;t.str=str;
const air=A.air&&A.air.alive&&(!seen||d>650)?A.air:null;
if(air){t.sel=1;thr=0;t.thr=0;const a=t.am[1],dd=air.p.distanceTo(t.g.position),fl=dd/a.v;_c.copy(air.p).addScaledVector(air.fwd,air.V*fl);const off=aimAt(t,dt,_c);
if(off<.012+4/dd&&canFire(t)){if(A.pause>0)A.pause-=dt;else{if(A.burst<=0)A.burst=Math.round(RV(4,9));if(tryFire(t)){A.burst--;if(A.burst<=0)A.pause=RV(.4,1)}}}return}
if(seen){const a=curAm(t),fl=d/a.v;A.settle=Math.min(1,A.settle+dt/(t.type==='abrams'?3.6:2.6));A.errT-=dt;
if(A.errT<=0){A.errT=RV(.5,1.1);const e=d*((.006+(Math.abs(t.sp)>1?.007:0)+(Math.abs(u.sp)>2?.004:0))*(1-A.settle*.75)+.0019);A.err.set(RV(-1,1)*e,RV(-.6,.6)*e,RV(-1,1)*e);A.terr.set(RV(-.6,.6),RV(-.3,.4),RV(-.6,.6))}
_c.set(A.spot[0],A.spot[1],A.spot[2]).applyMatrix4(u.inner.matrixWorld);if(!a.atgm){_c.x+=Math.sin(u.h)*u.sp*fl;_c.z+=Math.cos(u.h)*u.sp*fl}_c.add(A.err);
const off=aimAt(t,dt,_c),ready=A.vis.get(u)>A.react,tol=.006+1.6/d;
if(ready&&off<tol&&canFire(t)){if(t.D.ammo[0].belt&&!a.atgm){if(A.pause>0)A.pause-=dt;else{if(A.burst<=0)A.burst=Math.round(RV(3,8));if(tryFire(t)){A.burst--;if(A.burst<=0)A.pause=RV(.7,1.6)}}}
else if(!(a.atgm&&Math.abs(t.sp)>1.2))tryFire(t)}}
else{_c.set(t.x+Math.sin(t.h)*100,t.y+2.5,t.z+Math.cos(t.h)*100);aimAt(t,dt,_c)}}

/* ---------- Mürettebat sesi, SP, mod ---------- */
const VOICE={on:store.get('voice','1')==='1',last:0,say(s,pri){if(!this.on||!window.speechSynthesis||G.state!=='play')return;const n=performance.now();if(n-this.last<(pri?600:1600))return;this.last=n;
try{const S=speechSynthesis;if(pri)S.cancel();const u=new SpeechSynthesisUtterance(s);u.lang='tr-TR';u.rate=1.18;u.pitch=.85;u.volume=.85;const v=S.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith('tr'));if(v)u.voice=v;S.speak(u)}catch(e){}}};
const SPV={kill:160,air:200,assist:60,cap:120,pen:15,hitAir:12},TSP={blue:0,red:0};
G.mode=store.get('mode','rb');G.sp=0;
function addSP(u,v){if(!u||!u.team)return;TSP[u.team]+=v;if(u.isP)G.sp+=v}

/* ---------- Uçaklar: tanım, model, uçuş, silahlar, hasar, yapay zekâ ---------- */
const AIR={
a10:{key:'a10',air:1,name:'A-10A Thunderbolt II',short:'A-10A',mass:18000,thrust:84000,cd:1.12e-4,vstall:50,vmax:205,gmax:6.5,roll:1.6,cost:420,span:8.75,
gun:{id:'gau8',n:'GAU-8/A',k:'API',v:1010,pen:72,drag:.12,cal:30,spall:[2,30,14,2.2],core:60,col:[6,3.2,1.2],dmgAir:34},rof:.045,gunN:390,disp:.0045,
rk:{id:'hydra',n:'Hydra-70',k:'HEAT',v:700,pen:300,drag:.03,cal:70,heat:1,he:1,spall:[6,40,18,3],core:180,col:[7,4,2],rocket:1,dmgAir:130},rkN:14,bombN:6,
hp:{body:170,wingL:95,wingR:95,tail:75,eng:120,pilot:60},
vol:[['pilot','s',0,.65,5.3,.8],['body','s',0,0,3,1.15],['body','s',0,0,0,1.15],['body','s',0,0,-3,1.05],['eng','s',1.35,1.05,-3.3,.9],['eng','s',-1.35,1.05,-3.3,.9],
['wingL','b',4.9,-.35,.4,7.8,.55,2.8],['wingR','b',-4.9,-.35,.4,7.8,.55,2.8],['tail','b',0,1.1,-6.9,6.4,2.6,2]]},
su25:{key:'su25',air:1,name:'Su-25 Frogfoot',short:'Su-25',mass:15500,thrust:80000,cd:1.15e-4,vstall:55,vmax:220,gmax:6.5,roll:1.8,cost:420,span:7.2,
gun:{id:'gsh30',n:'GSh-30-2',k:'API',v:870,pen:58,drag:.12,cal:30,spall:[2,28,14,2],core:55,col:[6,2.5,1],dmgAir:30},rof:.05,gunN:250,disp:.005,
rk:{id:'s8',n:'S-8KO',k:'HEAT',v:600,pen:400,drag:.03,cal:80,heat:1,he:1,spall:[6,40,18,3],core:180,col:[7,4,2],rocket:1,dmgAir:130},rkN:20,bombN:4,
hp:{body:150,wingL:85,wingR:85,tail:70,eng:110,pilot:55},
vol:[['pilot','s',0,.6,4.6,.8],['body','s',0,0,2.5,1.1],['body','s',0,0,-.5,1.1],['body','s',0,0,-3.5,1],['eng','s',1,-.15,-2.4,.8],['eng','s',-1,-.15,-2.4,.8],
['wingL','b',4,.3,-.4,6.4,.5,2.8],['wingR','b',-4,.3,-.4,6.4,.5,2.8],['tail','b',0,1.6,-6.7,4.6,3,2.4]]}};
function mergeNI(list){let n=0;const L=list.map(g=>{g=g.index?g.toNonIndexed():g;if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));n+=g.attributes.position.count;return g});
const P=new Float32Array(n*3),Nn=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;for(const g of L){const k=g.attributes.position.count;P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);U.set(g.attributes.uv.array,o*2);o+=k}
const r=new T.BufferGeometry();r.setAttribute('position',new T.BufferAttribute(P,3));r.setAttribute('normal',new T.BufferAttribute(Nn,3));r.setAttribute('uv',new T.BufferAttribute(U,2));r.computeBoundingSphere();return r}
const camo=(cols,sd)=>cTex(256,(x,s)=>{x.fillStyle=cols[0];x.fillRect(0,0,s,s);const r=mkRng(sd);for(let k=1;k<cols.length;k++){x.fillStyle=cols[k];for(let i=0;i<16;i++){const px=r()*s,py=r()*s,rr=10+r()*34,ro=r()*3;
wrapD(s,px,py,rr*1.7,(a,b)=>{x.beginPath();x.ellipse(a,b,rr*1.6,rr,ro,0,7);x.fill()})}}speck(x,s,300,['rgba(0,0,0,.25)','rgba(255,255,255,.15)'],.5,1.5,.4)});
const PGEO={},PMAT={};
function planeGeo(k){if(PGEO[k])return PGEO[k];const B=[],D=[],GL=[],ST=[],a10=k==='a10';
const box=(w,h,d,x,y,z,f)=>{const g=new T.BoxGeometry(w,h,d).toNonIndexed();if(f){const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=f(p.getX(i),p.getY(i),p.getZ(i));p.setXYZ(i,v[0],v[1],v[2])}g.computeVertexNormals()}g.translate(x,y,z);return g};
const cylZ=(r0,r1,l,x,y,z,seg=12)=>{const g=new T.CylinderGeometry(r1,r0,l,seg);g.rotateX(Math.PI/2);g.translate(x,y,z);return g};
const prof=(a10?[[.2,-7.8],[.42,-6.8],[.7,-5],[.88,-2],[.92,3],[.8,6.1],[.42,7.3],[.05,8.1]]:[[.18,-7.6],[.35,-6.8],[.6,-5.2],[.8,-2.5],[.85,2],[.75,5.4],[.4,6.8],[.05,7.6]]).map(([r,z])=>new T.Vector2(r,z));
const lat=new T.LatheGeometry(prof,16);lat.rotateX(Math.PI/2);B.push(lat);
if(a10){B.push(box(17.5,.28,3,0,-.35,.4,(x,y,z)=>Math.abs(x)>8?[x,y-.05,z*.6-.25]:[x,y,z]));
for(const sx of[-1,1]){B.push(cylZ(.62,.62,3.4,sx*1.35,1.05,-3.3));D.push(cylZ(.5,.5,.12,sx*1.35,1.05,-1.55));D.push(cylZ(.42,.3,.4,sx*1.35,1.05,-5.1));B.push(box(.25,.6,1.4,sx*.95,.62,-3.3));
B.push(box(.16,2.3,1.9,sx*2.9,1.15,-7,(x,y,z)=>y>0?[x,y,z*.8-.15]:[x,y,z]));ST.push(box(.18,.5,1.1,sx*2.9,1.9,-7.15));B.push(box(.6,.55,2.1,sx*2.3,-.72,1))}
B.push(box(5.8,.16,1.7,0,.35,-6.9));D.push(cylZ(.085,.085,1.3,0,-.35,8.6,8))}
else{B.push(box(14.4,.25,3.2,0,.35,-.1,(x,y,z)=>Math.abs(x)>6?[x,y-.25,z*.5-1.5]:[x,y,z]));
for(const sx of[-1,1]){B.push(cylZ(.55,.5,4.6,sx*1,-.15,-2.2));D.push(cylZ(.42,.42,.12,sx*1,-.15,.15));D.push(cylZ(.4,.32,.4,sx*1,-.15,-4.6))}
B.push(box(4.6,.15,1.6,0,.75,-6.6,(x,y,z)=>Math.abs(x)>1.5?[x,y,z-.4]:[x,y,z]));B.push(box(.18,2.9,2.4,0,1.95,-6.6,(x,y,z)=>y>0?[x,y,z*.6-1]:[x,y,z]));ST.push(box(.2,.6,1.1,0,2.8,-7.5));D.push(cylZ(.08,.08,1,-.5,-.45,6.2,8))}
const cp=new T.SphereGeometry(.55,14,10);cp.scale(.85,.75,1.7);cp.translate(0,a10?.72:.68,a10?5.3:4.6);GL.push(cp);
return PGEO[k]={body:mergeNI(B),dark:mergeNI(D),glass:mergeNI(GL),stripe:mergeNI(ST)}}
function planeMats(k,team){const key=k+team;if(PMAT[key])return PMAT[key];
const tex=k==='a10'?camo(['#7f878c','#6c757b','#8c9396'],7):camo(['#a8996c','#6d6a44','#4d4832'],9);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);
return PMAT[key]={body:new T.MeshStandardMaterial({map:tex,roughness:.62,metalness:.25,side:T.DoubleSide,envMapIntensity:.9}),dark:new T.MeshStandardMaterial({color:0x22252a,roughness:.5,metalness:.6}),
glass:new T.MeshStandardMaterial({color:0x1b2a36,roughness:.08,metalness:.9,envMapIntensity:1.4}),stripe:new T.MeshStandardMaterial({color:TEAMC[team],emissive:TEAMC[team],emissiveIntensity:.35,roughness:.5})}}
const bombGeo=(()=>{const g=new T.CylinderGeometry(.23,.18,2.2,10);g.rotateX(Math.PI/2);return g})(),podGeo=(()=>{const g=new T.CylinderGeometry(.25,.25,2.1,10);g.rotateX(Math.PI/2);return g})();
function buildPlane(k,team){const G0=planeGeo(k),M=planeMats(k,team),g=new T.Group();for(const n of['body','dark','glass','stripe']){const m=new T.Mesh(G0[n],M[n]);m.castShadow=true;g.add(m)}
const D=AIR[k],bombs=[],pods=[],bx=k==='a10'?[3,4.4,5.8,-3,-4.4,-5.8]:[2.6,3.8,-2.6,-3.8],y=k==='a10'?-.85:-.15,px=k==='a10'?7.2:5;
for(let i=0;i<D.bombN;i++){const m=new T.Mesh(bombGeo,M.dark);m.position.set(bx[i],y,.5-Math.abs(bx[i])*(k==='su25'?.2:0));m.castShadow=true;g.add(m);bombs.push(m)}
for(const sx of[-1,1]){const m=new T.Mesh(podGeo,M.dark);m.position.set(sx*px,y+.05,.5-(k==='su25'?1.1:0));g.add(m);pods.push(m)}scene.add(g);return{g,bombs,pods}}
const PLANES=[],BOMBS=[];const _pu=new T.Vector3(),_pr=new T.Vector3(),_dq=new T.Quaternion(),_dl=new T.Vector3(),_qi=new T.Quaternion(),AXX=new T.Vector3(1,0,0),AXY=new T.Vector3(0,1,0),AXZ=new T.Vector3(0,0,1);
function makePlane(k,team,name,isP,pos,dir){const D=AIR[k],v=buildPlane(k,team),pl={D,kind:k,air:1,type:k,team,name,isP,g:v.g,vis:v,p:pos.clone(),q:new T.Quaternion(),fwd:new T.Vector3(),V:150,thr:.9,vf:0,
alive:true,falling:0,hp:{...D.hp},fire:0,gunN:D.gunN,rkN:D.rkN,bmN:D.bombN,gcd:0,rcd:0,bcd:0,rside:1,stats:{k:0,cap:0,score:0,hits:0},hitBy:{},x:pos.x,y:pos.y,z:pos.z,h:0,sp:0,spot:-99,lastShot:-9,ai:null,spin:0,man:0};
const m=new T.Matrix4().lookAt(new T.Vector3(),dir.clone().negate(),new T.Vector3(0,1,0));pl.q.setFromRotationMatrix(m);pl.fwd.set(0,0,1).applyQuaternion(pl.q);
pl.g.position.copy(pl.p);pl.g.quaternion.copy(pl.q);PLANES.push(pl);return pl}
function fly(pl,dt,Dw){const A=pl.D,ctl=pl.alive&&pl.hp.pilot>0;pl.fwd.set(0,0,1).applyQuaternion(pl.q);_pu.set(0,1,0).applyQuaternion(pl.q);_pr.set(-1,0,0).applyQuaternion(pl.q);
const engK=pl.hp.eng>0?.55+.45*pl.hp.eng/A.hp.eng:.12,tailK=pl.hp.tail>0?1:.3,L=cl((pl.V-A.vstall*.8)/(A.vstall*.5),0,1),bank=Math.atan2(-_pr.y,_pu.y);
let pr=0,yr=0,rr=0;
if(ctl&&Dw){_qi.copy(pl.q).invert();_dl.copy(Dw).applyQuaternion(_qi);const off=Math.acos(cl(_dl.z,-1,1)),lx=-_dl.x,ly=_dl.y;
const w=ss((off-.035)/.12)*(ly<0&&off<.6?0:1),rollErr=w*Math.atan2(lx,ly)+(1-w)*(-bank+lx*2.5);
const gpos=9.81*A.gmax/Math.max(pl.V,40);rr=cl(rollErr*3.2,-A.roll,A.roll);pr=cl(Math.atan2(ly,_dl.z)*2.6*tailK,-gpos*.45,gpos);yr=cl(Math.atan2(lx,_dl.z)*1.2,-.16,.16)*(1-w*.7)}
if(ctl&&pl.man)rr=pl.man*A.roll;
if(pl.hp.wingL<=0||pl.hp.wingR<=0){rr=(pl.hp.wingL<=0?-1:1)*2.6;pr*=.2}
if(!ctl||pl.falling){pr=-.18;rr=pl.spin||.5;yr=0}
if(L<1)pr=lp(-.45,pr,L);
_dq.setFromAxisAngle(AXX,-pr*dt);pl.q.multiply(_dq);_dq.setFromAxisAngle(AXY,-yr*dt);pl.q.multiply(_dq);_dq.setFromAxisAngle(AXZ,rr*dt);pl.q.multiply(_dq);pl.q.normalize();
pl.fwd.set(0,0,1).applyQuaternion(pl.q);const thrust=A.thrust*(pl.falling?0:pl.thr)*engK/A.mass,drag=A.cd*pl.V*pl.V*(1+Math.abs(pr)*1.6);
pl.V=cl(pl.V+(thrust-drag-9.81*pl.fwd.y)*dt,25,A.vmax*1.4);pl.vf=lp(pl.vf,(1-L)*24+(pl.falling?18:0),Math.min(1,dt*.8));
pl.p.addScaledVector(pl.fwd,pl.V*dt);pl.p.y-=pl.vf*dt;pl.x=pl.p.x;pl.y=pl.p.y;pl.z=pl.p.z;pl.h=Math.atan2(pl.fwd.x,pl.fwd.z);pl.sp=pl.V;
pl.g.position.copy(pl.p);pl.g.quaternion.copy(pl.q);return{L,bank}}
function planeRay(pl,P,d,max){_qi.copy(pl.q).invert();const o=_a.copy(P).sub(pl.p).applyQuaternion(_qi),ld=_b.copy(d).applyQuaternion(_qi);let best=max,part=null;
for(const v of pl.D.vol){let t;if(v[1]==='s'){const ox=o.x-v[2],oy=o.y-v[3],oz=o.z-v[4],b=ox*ld.x+oy*ld.y+oz*ld.z,c=ox*ox+oy*oy+oz*oz-v[5]*v[5],D=b*b-c;if(D<0)continue;t=-b-Math.sqrt(D)}
else t=rayBox(o.x,o.y,o.z,ld.x,ld.y,ld.z,[v[2],v[3],v[4]],[v[5],v[6],v[7]]);if(t>=0&&t<best){best=t;part=v[0]}}return part?{t:best,part}:null}
function planeHit(s,pl,part,P){const a=s.a,sh=s.t,dm=(a.dmgAir||(a.cal>100?240:a.cal>50?110:a.he?34:20))*RV(.8,1.2);
pl.hp[part]=Math.max(0,pl.hp[part]-dm);if(part!=='body')pl.hp.body=Math.max(0,pl.hp.body-dm*.35);pl.hitBy[sh.name]=clock.t;
for(let i=0;i<6;i++)fxP(ADD,P.x,P.y,P.z,RV(-6,6),RV(-6,6),RV(-6,6),RV(.15,.35),.3,.1,SPARK,1,6,.2,1,0);fxP(ADD,P.x,P.y,P.z,0,0,0,.08,a.he?3:1.6,.6,FIRE,1,0,0,1,0);
if((part==='eng'||part.startsWith('wing'))&&Math.random()<.12&&!pl.fire){pl.fire=1;if(pl.isP){note('UÇAK YANIYOR!','#ff6a50');VOICE.say('Yangın var!',1)}}
if(sh.isP){addSP(sh,SPV.hitAir);G.marker={s:part.startsWith('wing')&&pl.hp[part]<=0?'KANAT KOPTU':'UÇAĞA İSABET',c:'#f2c14e',t:1.4}}
if(pl.isP){G.hurt=Math.max(G.hurt,.5);G.shake=Math.max(G.shake,.4);IND.push({x:sh.x,z:sh.z,t:2});if(pl.hp[part]<=0)note({wingL:'Sol kanat koptu!',wingR:'Sağ kanat koptu!',tail:'Kuyruk hasarlı!',eng:'Motorlar durdu!',pilot:'Pilot vuruldu!'}[part]||'Gövde hasarı!','#ff6a50')}
if(pl.alive&&(pl.hp.body<=0||pl.hp.pilot<=0||pl.hp.wingL<=0||pl.hp.wingR<=0))shootDown(pl,sh)}
function shootDown(pl,killer){if(!pl.alive)return;pl.alive=false;pl.falling=1;pl.spin=RV(1.2,2.4)*(Math.random()<.5?-1:1);pl.fire=1;boom(pl.p.x,pl.p.y,pl.p.z,.9,1);AU.S.boom(pl.p,.8);
if(killer&&killer!==pl){killer.stats.k++;killer.stats.score+=200;addSP(killer,SPV.air);if(killer.isP){G.marker={s:'UÇAK DÜŞÜRÜLDÜ',c:'#ff5a4a',t:2.6};note(`+200 puan · +${SPV.air} SP  ${pl.D.short} düşürüldü`);VOICE.say('Uçak düşürüldü!',1)}}
FEED.unshift({a:killer&&killer!==pl?killer:null,v:pl,how:'✈',t:8});if(FEED.length>6)FEED.pop();G.tick[pl.team]=Math.max(0,G.tick[pl.team]-25);if(pl.isP)playerDied(killer)}
function crash(pl){pl.alive=false;pl.dead=1;const gy=hAt(pl.p.x,pl.p.z);boom(pl.p.x,gy+.5,pl.p.z,2.4,1);dustAt(pl.p.x,gy,pl.p.z,12,3);AU.S.boom(pl.p,1.3);scene.remove(pl.g);
if(!pl.falling){FEED.unshift({a:null,v:pl,how:'✈ düştü',t:8});G.tick[pl.team]=Math.max(0,G.tick[pl.team]-30);if(pl.isP)playerDied(null)}
for(const t of TANKS)if(t.alive&&Math.hypot(t.x-pl.p.x,t.z-pl.p.z)<6)destroyTank(t,null,'crew')}
function planeGun(pl){if(pl.gunN<=0||pl.gcd>0||!pl.alive)return;pl.gcd=pl.D.rof;pl.gunN--;const d=pl.fwd.clone(),ds=pl.D.disp*(pl.ai?2.2:1);d.x+=RV(-1,1)*ds;d.y+=RV(-1,1)*ds;d.z+=RV(-1,1)*ds;d.normalize();
const p=pl.p.clone().addScaledVector(pl.fwd,8.6);_c.set(0,-.35,0).applyQuaternion(pl.q);p.add(_c);const s=spawnShell(pl,pl.D.gun,p,d);s.v.addScaledVector(pl.fwd,pl.V);s.ignT=99;s.life=3;
pl.lastShot=clock.t;if(Math.random()<.5)fxP(ADD,p.x,p.y,p.z,d.x*20,d.y*20,d.z*20,.05,1.4,.5,FIRE,1,0,0,0,0);if(Math.random()<.35)fxP(SMK,p.x,p.y,p.z,0,0,0,RV(.8,1.6),.5,2.5,[.6,.58,.55],.25,0,.5);if(Math.random()<.5)AU.S.brrt(p)}
function planeRocket(pl){if(pl.rkN<=0||pl.rcd>0||!pl.alive)return;pl.rcd=.16;pl.rkN--;pl.rside*=-1;const p=pl.p.clone();_c.set(pl.rside*(pl.kind==='a10'?7.2:5),pl.kind==='a10'?-.8:-.1,1.5).applyQuaternion(pl.q);p.add(_c);
const d=pl.fwd.clone();d.x+=RV(-1,1)*.006;d.y+=RV(-1,1)*.006;d.z+=RV(-1,1)*.006;d.normalize();const s=spawnShell(pl,pl.D.rk,p,d);s.v.addScaledVector(pl.fwd,pl.V);s.ignT=99;s.life=5;
fxP(ADD,p.x,p.y,p.z,0,0,0,.08,1.5,.6,FIRE,1,0,0,1,0);AU.S.rocket(p);if(pl.rkN<=0)pl.vis.pods.forEach(m=>m.visible=false)}
function planeBomb(pl){if(pl.bmN<=0||pl.bcd>0||!pl.alive)return;pl.bcd=.3;pl.bmN--;const m=pl.vis.bombs[pl.bmN],p=m?m.getWorldPosition(new T.Vector3()):pl.p.clone();if(m)m.visible=false;
const mesh=new T.Mesh(bombGeo,planeMats(pl.kind,pl.team).dark);mesh.castShadow=true;scene.add(mesh);BOMBS.push({p,v:pl.fwd.clone().multiplyScalar(pl.V),mesh,team:pl.team,owner:pl});AU.S.ui(300)}
function bombPath(p0,v0){const p=p0.clone(),v=v0.clone();for(let i=0;i<500;i++){v.y-=9.81*.05;v.multiplyScalar(1-.01*.05);p.addScaledVector(v,.05);if(p.y<hAt(p.x,p.z))return p}return null}
function updBombs(dt){for(let i=BOMBS.length-1;i>=0;i--){const b=BOMBS[i];b.v.y-=9.81*dt;b.v.multiplyScalar(1-.01*dt);b.p.addScaledVector(b.v,dt);b.mesh.position.copy(b.p);b.mesh.lookAt(_a.copy(b.p).add(b.v));
let hit=b.p.y<hAt(b.p.x,b.p.z)+.3;if(!hit)gQuery(b.p.x,b.p.z,2,o=>{if(o.k==='bld'&&b.p.y<o.y0+o.h&&boxNear(o,b.p.x,b.p.z,.5))hit=true});if(!hit)for(const t of TANKS)if(t.alive&&b.p.distanceTo(t.g.position)<3.2)hit=true;
if(hit){scene.remove(b.mesh);BOMBS.splice(i,1);bombBoom(b)}}}
function bombBoom(b){const P=b.p,gy=hAt(P.x,P.z);boom(P.x,gy+.6,P.z,3.2,0);dustAt(P.x,gy,P.z,14,4);for(let i=0;i<14;i++)fxP(SMK,P.x,gy,P.z,RV(-10,10),RV(8,22),RV(-10,10),RV(1,2),.5,1.2,[.25,.2,.15],.9,16,.2,1);
AU.S.boom(P,1.8);if(G.player&&!G.player.air&&G.player.g.position.distanceTo(P)<60)G.shake=Math.max(G.shake,1.2);
for(const t of TANKS){if(!t.alive||t.team===b.team)continue;const d=Math.hypot(t.x-P.x,t.y+1.2-P.y,t.z-P.z);if(d>13)continue;
if(d<4.6){destroyTank(t,b.owner,'crew');continue}const k=1-(d-4.6)/8.4;t.trk.L=Math.max(0,t.trk.L-110*k*RV(.5,1));t.trk.R=Math.max(0,t.trk.R-110*k*RV(.5,1));
t.mods.forEach(m=>{if(Math.random()<k*.7)m.hp=Math.max(0,m.hp-m.max*k*RV(.4,1))});const lightK=t.type==='bradley'?1.6:.7;t.crew.forEach(c=>{if(c.alive&&Math.random()<k){c.hp-=RV(30,80)*k*lightK;if(c.hp<=0){c.hp=0;c.alive=0}}});
if(t.alive&&crewAlive(t)<=1)destroyTank(t,b.owner,'crew');else if(b.owner.isP){G.marker={s:'BOMBA İSABETİ',c:'#f2c14e',t:2}}if(t.isP){G.hurt=1;note('Bomba isabeti!','#ff6a50')}}
gQuery(P.x,P.z,12,o=>{if(!o.alive)return;const d=Math.hypot(o.x-P.x,o.z-P.z);if((o.k==='tree'||o.k==='pole')&&d<10)knock(o,o.x-P.x,o.z-P.z);else if(o.k==='wall'&&d<8)breakWall(o)})}
function planeTick(pl,dt){pl.gcd-=dt;pl.rcd-=dt;pl.bcd-=dt;const gy=hAt(pl.p.x,pl.p.z);pl.alt=pl.p.y-gy;
if(pl.fire){pl.hp.body-=dt*6;if(Math.random()<dt*30)fxP(ADD,pl.p.x,pl.p.y,pl.p.z,RV(-1,1),RV(-1,1),RV(-1,1),RV(.2,.45),1.6,.5,FIRE,1,0,1,0);if(pl.alive&&pl.hp.body<=0)shootDown(pl,null)}
const dmg=pl.hp.body<pl.D.hp.body*.6||pl.hp.eng<pl.D.hp.eng*.5||pl.falling;if((dmg||pl.fire)&&Math.random()<dt*(pl.falling?40:16))fxP(SMK,pl.p.x,pl.p.y,pl.p.z,RV(-.5,.5),RV(-.5,.5),RV(-.5,.5),RV(2,4),1,4.5,pl.fire?SMOKE:GREY,.55,-.1,.3);
if(pl.alt<1.2||pl.p.y<gy+1.2){crash(pl);return}
if(pl.alt<40)gQuery(pl.p.x,pl.p.z,8,o=>{if(pl.dead)return;if((o.k==='bld'&&pl.p.y<o.y0+o.h&&boxNear(o,pl.p.x,pl.p.z,2))||(o.k==='tree'&&pl.alt<7&&Math.hypot(o.x-pl.p.x,o.z-pl.p.z)<3))crash(pl)})}
const AIRSP={blue:{z:820,y:650},red:{z:-820,y:650}};
const _aiD=new T.Vector3();
function aiPlane(pl,dt){const A=pl.ai,p=pl.p,gy=hAt(p.x,p.z),alt=p.y-gy,D=_aiD;
if(!A.tgt||!A.tgt.alive||clock.t>A.retgt){let bd=1e9;A.tgt=null;for(const t of TANKS){if(!t.alive||t.team===pl.team)continue;const d=Math.hypot(t.x,t.z)*.4+Math.hypot(t.x-p.x,t.z-p.z);if(d<bd){bd=d;A.tgt=t}}A.retgt=clock.t+25}
const t=A.tgt;if(pl.gunN<=0&&pl.rkN<=0&&pl.bmN<=0)A.st='leave';if(!t&&A.st!=='leave')A.st='loiter';
if(A.st==='approach'||A.st==='loiter'){const tx=t?t.x:0,tz=t?t.z:0,ty=hAt(tx,tz)+620;D.set(tx-p.x,ty-p.y,tz-p.z);const hd=Math.hypot(tx-p.x,tz-p.z);if(t&&hd<1500&&alt>300)A.st='dive';if(hd<300&&!t){D.set(-p.z,0,p.x)}}
else if(A.st==='dive'){const d=p.distanceTo(t.g.position),fl=d/(pl.D.gun.v+pl.V);D.set(t.x+Math.sin(t.h)*t.sp*fl-p.x,t.y+1.2-p.y,t.z+Math.cos(t.h)*t.sp*fl-p.z);
const ang=pl.fwd.angleTo(_b.copy(D).normalize());if(d<1150&&ang<.03){planeGun(pl);if(d<850&&Math.random()<dt*2)planeRocket(pl)}
if(pl.bmN>0&&d<900){const ip=bombPath(p,_a.copy(pl.fwd).multiplyScalar(pl.V));if(ip&&ip.distanceTo(t.g.position)<9)planeBomb(pl)}
if(d<330||alt<130){A.st='pull';A.tt=clock.t+3.5}}
else if(A.st==='pull'){D.set(pl.fwd.x,.85,pl.fwd.z);if(clock.t>A.tt){A.st='egress';A.ex=p.x+pl.fwd.x*1300;A.ez=p.z+pl.fwd.z*1300}}
else if(A.st==='egress'){A.ex=cl(A.ex,-800,800);A.ez=cl(A.ez,-800,800);D.set(A.ex-p.x,gy+650-p.y,A.ez-p.z);if(Math.hypot(A.ex-p.x,A.ez-p.z)<250)A.st='approach'}
else{const s=AIRSP[pl.team];D.set(0-p.x,700-p.y,s.z*1.3-p.z);if(Math.abs(p.z)>950||Math.abs(p.x)>950){pl.alive=false;pl.dead=1;scene.remove(pl.g);return}}
if(alt<110&&pl.fwd.y<.05&&A.st!=='dive')D.set(pl.fwd.x,.8,pl.fwd.z);if(alt<70)D.set(pl.fwd.x,1,pl.fwd.z);
if(A.st!=='leave'&&(Math.abs(p.x)>720||Math.abs(p.z)>720))D.set(-p.x,0,-p.z);
pl.thr=A.st==='dive'?.75:1;fly(pl,dt,D.normalize())}
function spawnAIPlane(team){const k=team==='blue'?'a10':'su25',s=AIRSP[team],pos=new T.Vector3(RV(-200,200),hAt(0,s.z)+s.y,s.z),pl=makePlane(k,team,team==='blue'?pick(['Şimşek','Yıldırım']):pick(['Bora','Tufan']),0,pos,new T.Vector3(0,0,-Math.sign(s.z)));
pl.V=170;pl.ai={st:'approach',tgt:null,retgt:0};note(team==='red'?'DÜŞMAN TAARRUZ UÇAĞI GÖRÜLDÜ!':'Müttefik hava desteği bölgede',team==='red'?'#ff6a50':'#5fb0ff');if(team==='red')VOICE.say('Düşman uçağı!',1);return pl}

/* ---------- Muharebe: noktalar, biletler, kadro + SP ---------- */
const RESP=[],LINE=['abrams','bradley','a10'],COST={abrams:240,bradley:150,a10:420},UNIT=k=>AIR[k]||VEH[k];
function updCaps(dt){let nb=0,nr=0;const rk=G.mode==='ab'?1.6:1;for(const c of CAPS){let b=0,r=0;for(const t of TANKS)if(t.alive&&Math.hypot(t.x-c.x,t.z-c.z)<c.r)t.team==='blue'?b++:r++;c.nb=b;c.nr=r;
const rate=dt/16*rk,pv=c.v;if(b&&!r)c.v=Math.min(1,c.v+rate*Math.sqrt(b));else if(r&&!b)c.v=Math.max(-1,c.v-rate*Math.sqrt(r));
if(pv<1&&c.v>=1){c.owner='blue';note(`${c.id} NOKTASI ELE GEÇİRİLDİ`,'#5fb0ff');TANKS.forEach(t=>{if(t.alive&&t.team==='blue'&&Math.hypot(t.x-c.x,t.z-c.z)<c.r){t.stats.cap++;t.stats.score+=150;addSP(t,SPV.cap);if(t.isP){note(`+150 puan · +${SPV.cap} SP  Nokta ele geçirildi`);VOICE.say('Nokta bizim!',1)}}})}
if(pv>-1&&c.v<=-1){c.owner='red';note(`${c.id} NOKTASI DÜŞMANA GEÇTİ`,'#ff5a4a');TANKS.forEach(t=>{if(t.alive&&t.team==='red'&&Math.hypot(t.x-c.x,t.z-c.z)<c.r)addSP(t,SPV.cap)})}
if((c.owner==='blue'&&c.v<=0)||(c.owner==='red'&&c.v>=0)){if(c.owner==='blue'){note(`${c.id} NOKTASI KAYBEDİLDİ`,'#ff5a4a');VOICE.say('Noktayı kaybediyoruz!')}c.owner='none'}
const col=TEAMC[c.owner];c.mat.color.copy(col);c.flagM.color.copy(col);c.mat.opacity=(b||r)?.55+.3*Math.sin(clock.t*6):.7;
c.flag.position.y=lp(c.flag.position.y,c.fy+3.2+6.6*Math.abs(c.v),Math.min(1,dt*3));if(c.owner==='blue')nb++;else if(c.owner==='red')nr++}
if(nb>nr)G.tick.red=Math.max(0,G.tick.red-(nb-nr)*.55*dt);else if(nr>nb)G.tick.blue=Math.max(0,G.tick.blue-(nr-nb)*.55*dt)}
function clearBattle(){for(const t of TANKS){scene.remove(t.g);if(t.turret.parent===scene)scene.remove(t.turret);t.ms.all.forEach(m=>m.dispose())}TANKS.length=0;
PLANES.forEach(p=>scene.remove(p.g));PLANES.length=0;BOMBS.forEach(b=>scene.remove(b.mesh));BOMBS.length=0;
SHELLS.forEach(s=>scene.remove(s.mesh));SHELLS.length=0;DEBRIS.length=0;RESP.length=0;FEED.length=0;MSG.length=0;IND.length=0;G.hitcam=null;G.marker=null}
function addTank(type,team,name,x,z,h,isP){const t=makeTank(type,team,name,isP);t.x=x;t.z=z;t.h=h;t.y=hAt(x,z);place(t,0);TANKS.push(t);if(!isP)newAI(t,TANKS.filter(u=>u.team===team&&!u.isP).length);return t}
function startBattle(){clearBattle();CAPS.forEach(c=>{c.v=0;c.owner='none'});G.tick={blue:700,red:700};G.time=1080;G.used={};G.result=null;G.deathT=0;G.deadShown=0;G.bound=0;G.player=null;G.sp=0;G.first=0;TSP.blue=TSP.red=0;G.bt=0;
['abrams','bradley','abrams','abrams','bradley','abrams'].forEach((k,i)=>addTank(k,'red',NAMES.red[i%5]+(i>4?'-2':''),SPAWN.red.x+(i-2.5)*16,SPAWN.red.z+RV(-6,6),SPAWN.red.h,0));
['bradley','abrams','abrams','bradley','abrams'].forEach((k,i)=>addTank(k,'blue',NAMES.blue[i],SPAWN.blue.x+[-44,-26,26,44,62][i],SPAWN.blue.z+RV(-6,6),SPAWN.blue.h,0));
G.state='play';showSpawn(true)}
const spCost=k=>(!G.first&&!AIR[k])?0:COST[k],canSpawn=k=>!G.used[k]&&G.sp>=spCost(k);
function doSpawn(k){if(!canSpawn(k))return false;G.sp-=spCost(k);G.used[k]=1;if(!AIR[k])G.first=1;if(G.player){G.player.isP=false;G.player.prevP=true}
if(AIR[k]){const s=AIRSP.blue,pos=new T.Vector3(RV(-90,90),hAt(0,s.z)+s.y,s.z),pl=makePlane(k,'blue','Sen',1,pos,new T.Vector3(0,0,-1));pl.V=165;G.player=pl;cs.yaw=Math.PI;cs.pitch=-.06;cs.dist=20;VOICE.say('Kalkışa hazır!',1)}
else{const sp=SPAWN.blue,p=addTank(k,'blue','Sen',sp.x+RV(-10,10),sp.z+RV(-3,8),sp.h,1);G.player=p;cs.yaw=p.h;cs.pitch=.05;cs.dist=13;p.extCd=0}
cs.sight=0;cs.zoom=0;G.deathT=0;G.deadShown=0;G.bound=0;note(`${UNIT(k).name} sahada`,'#f2c14e');return true}
function playerDied(k){G.deathT=0;G.killer=k&&k!==G.player?k:null;cs.sight=0;mouseF=touchF=0;rocketF=0;if(G.player&&!G.player.air)VOICE.say('Araç kaybedildi!',1)}
function leaveVehicle(){const p=G.player;if(!p||!p.alive)return;if(p.air){p.alive=false;p.dead=1;scene.remove(p.g);G.tick.blue=Math.max(0,G.tick.blue-30);playerDied(null)}else destroyTank(p,null,'crew');G.deathT=2.5}
function checkEnd(){if(G.result)return;const al=tm=>TANKS.some(t=>t.alive&&t.team===tm)||RESP.some(r=>r.team===tm),pAlive=G.player&&G.player.alive,pCan=LINE.some(canSpawn);
let r=null;if(G.tick.red<=0||!al('red'))r='win';else if(G.tick.blue<=0||(!al('blue')&&!pAlive&&!pCan))r='lose';else if(G.time<=0)r=G.tick.blue>=G.tick.red?'win':'lose';if(r)endBattle(r)}

/* ---------- Girdi ---------- */
const K={},cs={yaw:Math.PI,pitch:.05,dist:13,sight:0,zoom:0,free:0,fy:0,fp:0,fov:55},AIM={o:new T.Vector3(),d:new T.Vector3(0,0,-1),p:new T.Vector3(),ok:0,dist:0,t:null},
js={x:0,y:0,cx:0,cy:0,on:0,id:-1},JR=64,ptr=new Map();let mouseF=0,touchF=0,rocketF=0,SW=innerWidth,SH=innerHeight,dpr=1,paused=0,tabOn=0;
const isAir=()=>G.player&&G.player.air&&G.player.alive,zoomOf=()=>cs.sight&&G.player&&!G.player.air?G.player.D.zoom[cs.sight-1]:1;
function look(dx,dy,k){k/=zoomOf();if(isAir())k*=1.15;if(cs.free){cs.fy-=dx*k;cs.fp=cl(cs.fp-dy*k,-.8,.9);return}cs.yaw-=dx*k;const pm=isAir()?1.45:cs.sight?.9:.65;cs.pitch=cl(cs.pitch-dy*k,isAir()?-1.45:cs.sight?-.35:-.5,pm)}
function sightStep(d){const p=G.player;if(!p||!p.alive||p.air)return;cs.sight=cl(cs.sight+d,0,2);AU.S.ui(cs.sight?660:520)}
function selAmmo(i){const p=G.player;if(!p||!p.alive||p.air||i>=p.am.length||i===p.sel)return;p.sel=i;if(p.D.ammo[0].belt)p.swapT=.45;AU.S.ui(740);
note(p.D.ammo[0].belt?`${p.am[i].k} seçildi`:`Sonraki mermi: ${p.am[i].k}  ·  [R] hızlı doldur`,'#d9d2b8')}
function doRepair(){const p=G.player;if(!p||!p.alive||p.air)return;if(p.repT>0){p.repT=0;note('Onarım iptal edildi','#d9d2b8');return}if(!needsRepair(p)){note('Onarılacak modül yok','#d9d2b8');return}
if(Math.abs(p.sp)>.7){note('Onarım için dur','#d9d2b8');return}p.repT=.001;note(`Onarım başladı (${Math.round(p.D.repair*(G.mode==='ab'?.6:1))} sn)`,'#d9d2b8')}
function doExt(){const p=G.player;if(!p||!p.alive||p.air||!p.fire)return;if(p.extCd>0){note(`Söndürücü hazır değil (${Math.ceil(p.extCd)} sn)`,'#d9d2b8');return}p.ext=1.8;p.extCd=14;note('Yangın söndürülüyor…','#d9d2b8')}
const playing=()=>G.state==='play'&&!paused&&!G.deadShown;
const bt=()=>({fire:{x:SW-96,y:SH-104,r:58},sight:{x:SW-64,y:SH-226,r:33},ammo:{x:SW-196,y:SH-56,r:33},rep:{x:SW-272,y:SH-50,r:28},ext:{x:SW-196,y:SH-140,r:28}});
function setTouch(on){if(touchUI===on)return;touchUI=on;document.body.classList.toggle('touch',on)}
hc.addEventListener('pointerdown',e=>{AU.init();AU.resume();if(e.pointerType==='touch')setTouch(true);else if(e.pointerType==='mouse')setTouch(false);
if(!playing()||!G.player)return;e.preventDefault();const x=e.clientX,y=e.clientY,p=G.player;
if(e.pointerType==='mouse'){if(e.button===2){if(isAir())cs.zoom=1;else sightStep(cs.sight?-cs.sight:1);return}
if(document.pointerLockElement===hc)mouseF=1;else{try{const r=hc.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(_){}hc.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{r:'look',x,y})}return}
hc.setPointerCapture(e.pointerId);const b=bt(),nr=q=>Math.hypot(x-q.x,y-q.y)<q.r+12;
if(nr(b.fire)){touchF=1;ptr.set(e.pointerId,{r:'fire',x,y})}
else if(nr(b.sight)){if(isAir())planeBomb(p);else sightStep(cs.sight===2?-2:1)}
else if(nr(b.ammo)){if(isAir()){rocketF=1;ptr.set(e.pointerId,{r:'rk',x,y})}else if(p.alive)selAmmo((p.sel+1)%p.am.length)}
else if(nr(b.rep)&&!isAir()&&p.alive&&(needsRepair(p)||p.repT))doRepair();else if(nr(b.ext)&&!isAir()&&p.alive&&p.fire)doExt();
else if(x<SW*.42&&y>SH*.3&&!js.on){js.on=1;js.cx=x;js.cy=y;js.id=e.pointerId;ptr.set(e.pointerId,{r:'stick'})}else ptr.set(e.pointerId,{r:'look',x,y})});
hc.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p||!playing())return;
if(p.r==='look'||p.r==='fire'||p.r==='rk'){if(p.r!=='look'&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<8)return;look(e.clientX-p.x,e.clientY-p.y,e.pointerType==='mouse'?.0035:.005);p.x=e.clientX;p.y=e.clientY}
else if(p.r==='stick'){let vx=(e.clientX-js.cx)/JR,vy=(e.clientY-js.cy)/JR;const l=Math.hypot(vx,vy);if(l>1){vx/=l;vy/=l}js.x=Math.abs(vx)<.12?0:vx;js.y=Math.abs(vy)<.12?0:-vy}});
const up=e=>{if(e.pointerType==='mouse'){mouseF=0;if(e.button===2)cs.zoom=0}const p=ptr.get(e.pointerId);if(!p)return;if(p.r==='fire')touchF=0;if(p.r==='rk')rocketF=0;if(p.r==='stick'){js.on=0;js.x=js.y=0}ptr.delete(e.pointerId)};
hc.addEventListener('pointerup',up);hc.addEventListener('pointercancel',up);
addEventListener('mousemove',e=>{if(document.pointerLockElement===hc&&playing())look(e.movementX,e.movementY,.0021)});
hc.addEventListener('wheel',e=>{if(!playing())return;e.preventDefault();if(isAir()){cs.dist=cl(cs.dist+(e.deltaY>0?3:-3),10,40);return}if(cs.sight)sightStep(e.deltaY<0?1:-1);else{if(cs.dist<=6&&e.deltaY<0)sightStep(1);cs.dist=cl(cs.dist+(e.deltaY>0?2:-2),6,24)}},{passive:false});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement){mouseF=0;cs.zoom=0}if(!document.pointerLockElement&&playing()&&!touchUI&&G.player&&G.player.alive)pause(1)});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright','tab'].includes(k))e.preventDefault();if(e.repeat&&k!=='tab')return;K[k]=1;setTouch(false);
if(G.state==='menu'&&k==='enter'){$('#go').click();return}
if(k==='escape'||k==='p'){if(G.state==='play'&&!G.deadShown)pause(!paused);return}if(!playing())return;const p=G.player;if(!p||!p.alive){return}
if(k==='j'){leaveVehicle();return}if(k==='tab'){tabOn=1;return}if(k==='c'){cs.free=1;return}
if(p.air){if(k===' ')planeBomb(p);return}
if(k==='1'||k==='2'||k==='3')selAmmo(+k-1);else if(k==='r')quickReload(p);else if(k==='x')doRepair();else if(k==='f')doExt();else if(k==='shift'||k==='z')sightStep(cs.sight?-cs.sight:1)});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();delete K[k];if(k==='c'){cs.free=0;cs.fy=cs.fp=0}if(k==='tab')tabOn=0});
addEventListener('blur',()=>{for(const k in K)delete K[k];mouseF=touchF=rocketF=0;tabOn=0;cs.zoom=0});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing())pause(1)});

/* ---------- Nişan ışını ---------- */
function castRay(o,d,max,skip){let best=max,hit=null;
for(const t of TANKS){if(t===skip)continue;const qx=t.x-o.x,qy=t.y+1.5-o.y,qz=t.z-o.z,k=qx*d.x+qy*d.y+qz*d.z;if(k<0||k>best+8)continue;const ex=qx-d.x*k,ey=qy-d.y*k,ez=qz-d.z*k;if(ex*ex+ey*ey+ez*ez>64)continue;
RC.set(o,d);RC.near=0;RC.far=best;const r=RC.intersectObjects(t.hit,false);if(r.length&&r[0].distance<best){best=r[0].distance;hit=t}}
for(const pl of PLANES){if(pl===skip||!pl.alive)continue;const r=planeRay(pl,o,d,best);if(r&&r.t<best){best=r.t;hit=pl}}
const tg=segTerrain(o.x,o.y,o.z,d.x,d.y,d.z,best,best>600?5:3);if(tg>=0&&tg<best){best=tg;hit=null}
const ob=segObs(o.x,o.y,o.z,d.x,d.y,d.z,best,x=>x.k!=='tree'&&x.k!=='pole');if(ob&&ob.t<best){best=ob.t;hit=null}return{d:best,t:hit}}

/* ---------- Kamera ---------- */
const VD=new T.Vector3(),MENU={prev:[],plane:null};
function view(dt){const p=G.player;let fov=55;VD.set(Math.sin(cs.yaw)*Math.cos(cs.pitch),Math.sin(cs.pitch),Math.cos(cs.yaw)*Math.cos(cs.pitch));
if(G.state==='menu'||G.state==='load'){const a=clock.t*.1,cx=SPAWN.blue.x,cz=SPAWN.blue.z-4,cy=hAt(cx,cz);
cam.position.set(cx+Math.sin(a)*17,cy+4.2,cz+Math.cos(a)*17);cam.lookAt(cx-Math.cos(a)*3,cy+2,cz+Math.sin(a)*3)}
else if(p&&p.alive&&p.air){const fy=cs.yaw+cs.fy,fp=cl(cs.pitch+cs.fp,-1.5,1.5),Dv=_a.set(Math.sin(fy)*Math.cos(fp),Math.sin(fp),Math.cos(fy)*Math.cos(fp)),dist=cs.zoom?11:cs.dist;
cam.position.copy(p.p).addScaledVector(Dv,-dist);cam.position.y+=dist*.17+1.5;const gy=hAt(cam.position.x,cam.position.z)+2;if(cam.position.y<gy)cam.position.y=gy;cam.lookAt(_b.copy(cam.position).add(Dv));fov=cs.zoom?36:62;
AIM.o.copy(cam.position);AIM.d.copy(VD);AIM.ok=1;if(G.shake>0){cam.position.x+=RV(-1,1)*G.shake*.15;cam.position.y+=RV(-1,1)*G.shake*.15}}
else if(p&&p.alive){if(cs.sight){p.g.visible=false;gunRay(p,_mp,_md);p.gunPivot.getWorldPosition(cam.position);cam.position.addScaledVector(_md,1.1);_c.set(0,1,0).transformDirection(p.gun.matrixWorld);cam.position.addScaledVector(_c,.12);
cam.up.copy(_c);cam.lookAt(_a.copy(cam.position).add(_md));cam.up.set(0,1,0);fov=2*Math.atan(Math.tan(27.5*DEG)/zoomOf())/DEG}
else{p.g.visible=true;const fy=cs.yaw+cs.fy,fp=cl(cs.pitch+cs.fp,-.5,.75),Dv=_a.set(Math.sin(fy)*Math.cos(fp),Math.sin(fp),Math.cos(fy)*Math.cos(fp));
cam.position.set(p.x,p.y+p.D.camH,p.z).addScaledVector(Dv,-cs.dist);cam.position.y+=.8+cs.dist*.07;const gy=hAt(cam.position.x,cam.position.z)+1.2;if(cam.position.y<gy)cam.position.y=gy;cam.lookAt(_b.copy(cam.position).add(Dv))}
AIM.o.copy(cam.position);AIM.d.copy(VD);const r=castRay(AIM.o,AIM.d,2400,p);AIM.dist=r.d;AIM.t=r.t;AIM.p.copy(AIM.o).addScaledVector(AIM.d,r.d);AIM.ok=1;
if(G.shake>0){cam.position.x+=RV(-1,1)*G.shake*.12;cam.position.y+=RV(-1,1)*G.shake*.12}}
else{if(p&&!p.air)p.g.visible=true;const a=clock.t*.15+1,k=G.killer&&G.killer.alive&&G.deathT>1.5?G.killer:p&&!p.dead?p:null;
const kx=k?k.x:SPAWN.blue.x,kz=k?k.z:SPAWN.blue.z-60,ky=k?(k.air?k.y:hAt(kx,kz)):hAt(kx,kz),r0=k&&k.air?40:k?16:70;
cam.position.set(kx+Math.sin(a)*r0,ky+(k?7:30),kz+Math.cos(a)*r0);const gy=hAt(cam.position.x,cam.position.z)+2;if(cam.position.y<gy)cam.position.y=gy;cam.lookAt(kx,ky+1.6,kz)}
cs.fov=lp(cs.fov,fov,Math.min(1,dt*(cs.sight?14:8)+(dt?0:1)));if(Math.abs(cam.fov-cs.fov)>.01){cam.fov=cs.fov;cam.updateProjectionMatrix()}
sky.position.copy(cam.position);const fp=p&&p.alive?(p.air?_c.set(cam.position.x,hAt(cam.position.x,cam.position.z),cam.position.z):p.g.position):cam.position,tx=124/Q.shadow;
const sx=Math.round(fp.x/tx)*tx,sz=Math.round(fp.z/tx)*tx;sun.position.set(sx+sunDir.x*200,fp.y+sunDir.y*200,sz+sunDir.z*200);sun.target.position.set(sx,fp.y,sz);sun.target.updateMatrixWorld();
G.shake=Math.max(0,G.shake-dt*2.6);G.hurt=Math.max(0,G.hurt-dt*1.4)}

/* ---------- HUD ---------- */
const FT=(s,w=700)=>`${w} ${s}px "Barlow Condensed",sans-serif`,FM=s=>`500 ${s}px "DM Mono",monospace`;
const HC={w:'#ece7d8',m:'#a3a59a',y:'#f2c14e',b:'#5fb0ff',r:'#ff5a4a',g:'#7fe08a',dk:'rgba(14,17,19,.6)'};
const tcol=tm=>tm==='blue'?HC.b:HC.r;
function tx(s,x,y,c,f,al){hx.font=f;hx.textAlign=al||'center';hx.fillStyle='rgba(0,0,0,.6)';hx.fillText(s,x+1,y+1.2);hx.fillStyle=c;hx.fillText(s,x,y)}
const _pv=new T.Vector3();function proj(x,y,z){_pv.set(x,y,z).project(cam);return _pv.z<1?[(_pv.x+1)/2*SW,(1-_pv.y)/2*SH]:null}
const stCol=(r,cr)=>r<=0?(cr?'#2a2a2a':HC.r):r<.35?'#ff8a3a':r<.7?HC.y:(cr?'#e8e3d4':'rgba(236,231,216,.28)');
function schem(x,cx,cy,sc,t,st){const D=t.D,hw=D.hw,hl=D.hl,cz=D.cz,P=(px,pz)=>[cx-px*sc,cy-pz*sc],rg=t.turret.userData.ring||t.turret.position,ya=st.ya,c=Math.cos(ya),s=Math.sin(ya),R=st.R;
x.save();x.lineWidth=1.2;x.strokeStyle='rgba(236,231,216,.55)';x.fillStyle='rgba(236,231,216,.06)';
const[a0,b0]=P(hw,cz+hl);x.beginPath();x.rect(a0,b0,2*hw*sc,2*hl*sc);x.fill();x.stroke();
for(const[sg,k]of[[1,'L'],[-1,'R']]){const[u,v]=P(sg>0?hw:-hw+.62,cz+hl);x.fillStyle=stCol(st.trk[k]/100);x.fillRect(u,v,.62*sc,2*hl*sc)}
const tw=(lx,lz)=>[rg.x+lx*c+lz*s,rg.z-lx*s+lz*c];
for(const m of st.mods){x.fillStyle=stCol(m.hp/m.max);
if(m.t){const[wx,wz]=tw(m.c[0],m.c[2]),[u,v]=P(wx,wz);x.save();x.translate(u,v);x.rotate(ya);x.fillRect(-m.s[0]*sc/2,-m.s[2]*sc/2,m.s[0]*sc,m.s[2]*sc);x.restore()}
else{const[u,v]=P(m.c[0]+m.s[0]/2,m.c[2]+m.s[2]/2);x.fillRect(u,v,m.s[0]*sc,m.s[2]*sc)}}
const[tu,tv]=P(rg.x,rg.z),tr=(t.type==='abrams'?1.25:.95)*sc;x.strokeStyle='rgba(236,231,216,.8)';x.lineWidth=1.4;x.beginPath();x.arc(tu,tv,tr,0,7);x.stroke();
x.beginPath();x.moveTo(tu-s*tr,tv-c*tr);x.lineTo(tu-s*tr*2.9,tv-c*tr*2.9);x.lineWidth=2.4;x.strokeStyle=st.barrel>0?'rgba(236,231,216,.8)':HC.r;x.stroke();
for(const m of st.crew){let px=m.c[0],pz=m.c[2];if(m.t)[px,pz]=tw(px,pz);const[u,v]=P(px,pz),r=sc*.26+1.5;x.beginPath();x.arc(u,v,r,0,7);
x.fillStyle=m.moved?'rgba(40,40,40,.6)':m.alive?(m.hp>60?'#e8e3d4':m.hp>30?HC.y:'#ff8a3a'):'#2a2a2a';x.fill();x.strokeStyle=m.alive?'rgba(0,0,0,.5)':HC.r;x.lineWidth=1;x.stroke();
if(!m.alive&&!m.moved){x.beginPath();x.moveTo(u-r,v-r);x.lineTo(u+r,v+r);x.moveTo(u+r,v-r);x.lineTo(u-r,v+r);x.strokeStyle=HC.r;x.stroke()}}
if(R&&R.ep&&R.ed){const L=R.res==='pen'?R.am.spall[3]:0,[u0,v0]=P(R.ep.x-R.ed.x*6,R.ep.z-R.ed.z*6),[u1,v1]=P(R.ep.x,R.ep.z),[u2,v2]=P(R.ep.x+R.ed.x*L,R.ep.z+R.ed.z*L);
x.strokeStyle=R.res==='pen'?HC.y:'#d9d2b8';x.lineWidth=2;x.setLineDash([5,3]);x.beginPath();x.moveTo(u0,v0);x.lineTo(u1,v1);x.stroke();x.setLineDash([]);
if(L){x.strokeStyle=HC.r;x.beginPath();x.moveTo(u1,v1);x.lineTo(u2,v2);x.stroke()}x.fillStyle=R.res==='pen'?HC.r:HC.y;x.beginPath();x.arc(u1,v1,3.5,0,7);x.fill()}x.restore()}
const MMC=(()=>{const c=document.createElement('canvas'),S=256;c.width=c.height=S;const x=c.getContext('2d'),d=x.createImageData(S,S),D=d.data;
for(let j=0;j<S;j++)for(let i=0;i<S;i++){const wx=-BA+(i+.5)/S*2*BA,wz=-BA+(j+.5)/S*2*BA,h=hAt(wx,wz),e=2*BA/S,gx=hAt(wx+e,wz)-hAt(wx-e,wz),gz=hAt(wx,wz+e)-hAt(wx,wz-e),
sh=cl(.75+(-gx*sunDir.x-gz*sunDir.z)*.09,.35,1.15),k=(j*S+i)*4,rd=roadD(wx,wz)<3.5,wd=Math.abs(wz-wadiZ(wx))<6;
let r=128+h*.9,g=124+h*.7,b=92+h*.4;if(rd){r=186;g=168;b=132}else if(wd){r=110;g=100;b=82}D[k]=r*sh;D[k+1]=g*sh;D[k+2]=b*sh;D[k+3]=255}x.putImageData(d,0,0);
x.fillStyle='rgba(60,72,40,.55)';for(const k in TREES)TREES[k].forEach(o=>{if(Math.abs(o.x)<BA&&Math.abs(o.z)<BA)x.fillRect((o.x+BA)/(2*BA)*S-1,(o.z+BA)/(2*BA)*S-1,2,2)});
x.fillStyle='rgba(70,60,50,.9)';BLD.forEach(b=>{x.save();x.translate((b.x+BA)/(2*BA)*S,(b.z+BA)/(2*BA)*S);x.rotate(-b.a);x.fillRect(-b.hw/(2*BA)*S,-b.hd/(2*BA)*S,b.hw/BA*S,b.hd/BA*S);x.restore()});return c})();
function minimap(p,mx,my,Ms){const x=hx,m=(wx,wz)=>[mx+(wx+BA)/(2*BA)*Ms,my+(wz+BA)/(2*BA)*Ms];
x.save();x.globalAlpha=.92;x.drawImage(MMC,mx,my,Ms,Ms);x.globalAlpha=1;x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=1;x.beginPath();for(let i=1;i<8;i++){const q=mx+i*Ms/8,r=my+i*Ms/8;x.moveTo(q,my);x.lineTo(q,my+Ms);x.moveTo(mx,r);x.lineTo(mx+Ms,r)}x.stroke();
x.font=FM(8);x.fillStyle='rgba(20,20,18,.75)';x.textAlign='center';for(let i=0;i<8;i++){x.fillText('ABCDEFGH'[i],mx+(i+.5)*Ms/8,my+6);x.fillText(i+1,mx+5,my+(i+.5)*Ms/8)}
x.strokeStyle='rgba(255,70,50,.85)';x.lineWidth=2;x.strokeRect(mx+1,my+1,Ms-2,Ms-2);
for(const c of CAPS){const[u,v]=m(c.x,c.z);x.beginPath();x.arc(u,v,c.r/(2*BA)*Ms+3,0,7);x.fillStyle=c.owner==='blue'?'rgba(95,176,255,.45)':c.owner==='red'?'rgba(255,90,74,.45)':'rgba(255,255,255,.3)';x.fill();
x.strokeStyle='#fff';x.lineWidth=1;x.stroke();tx(c.id,u,v+.5,'#fff',FT(11,800))}
for(const t of TANKS){if(t===p)continue;const[u,v]=m(t.x,t.z);if(!t.alive){x.fillStyle='rgba(30,30,30,.7)';x.fillRect(u-2,v-2,4,4);continue}
if(t.team==='red'&&clock.t-t.spot>3)continue;x.save();x.translate(u,v);x.rotate(-t.h+Math.PI);x.fillStyle=t.team==='blue'?HC.b:HC.r;x.strokeStyle='rgba(0,0,0,.6)';
x.beginPath();x.moveTo(0,-5);x.lineTo(3.6,4);x.lineTo(-3.6,4);x.closePath();x.fill();x.stroke();x.restore()}
for(const pl of PLANES){if(pl===p||!pl.alive)continue;if(pl.team==='red'&&clock.t-pl.spot>3)continue;const[u,v]=m(pl.x,pl.z);x.save();x.translate(u,v);x.rotate(-pl.h+Math.PI);x.fillStyle=tcol(pl.team);x.strokeStyle='rgba(0,0,0,.7)';
x.beginPath();x.moveTo(0,-7);x.lineTo(2,-1);x.lineTo(8,2);x.lineTo(2,2);x.lineTo(1.5,6);x.lineTo(3.5,8);x.lineTo(-3.5,8);x.lineTo(-1.5,6);x.lineTo(-2,2);x.lineTo(-8,2);x.lineTo(-2,-1);x.closePath();x.fill();x.stroke();x.restore()}
if(p){const[u,v]=m(p.x,p.z);x.save();x.translate(u,v);x.rotate(-cs.yaw+Math.PI);x.fillStyle='rgba(255,255,255,.14)';x.beginPath();x.moveTo(0,0);x.arc(0,0,40,-Math.PI/2-.45,-Math.PI/2+.45);x.fill();x.restore();
x.save();x.translate(u,v);x.rotate(-p.h+Math.PI);x.fillStyle=p.alive?'#fff':'#666';x.strokeStyle='#000';x.beginPath();x.moveTo(0,-7);x.lineTo(5,5);x.lineTo(-5,5);x.closePath();x.fill();x.stroke();x.restore()}x.restore()}
function topBar(){const cx=SW/2,y=touchUI?30:28;
for(let i=0;i<3;i++){const c=CAPS[i],u=cx+(i-1)*44;hx.fillStyle=HC.dk;hx.beginPath();hx.arc(u,y,15,0,7);hx.fill();
hx.lineWidth=3;if(Math.abs(c.v)>.01){hx.strokeStyle=c.v>0?HC.b:HC.r;hx.beginPath();hx.arc(u,y,15,-Math.PI/2,-Math.PI/2+Math.abs(c.v)*6.283);hx.stroke()}
hx.lineWidth=1;hx.strokeStyle='rgba(255,255,255,.25)';hx.beginPath();hx.arc(u,y,18,0,7);hx.stroke();tx(c.id,u,y+1,c.owner==='blue'?HC.b:c.owner==='red'?HC.r:HC.w,FT(17,800))}
const L=Math.min(170,SW*.16);for(const[tm,sg]of[['blue',-1],['red',1]]){const v=G.tick[tm],x0=cx+sg*84;hx.fillStyle=HC.dk;hx.fillRect(sg<0?x0-L:x0,y-5,L,10);hx.fillStyle=tcol(tm);
const w=L*v/700;hx.fillRect(sg<0?x0-w:x0,y-5,w,10);tx(String(Math.ceil(v)),x0+sg*(L+8),y+1,tcol(tm),FT(17,800),sg<0?'right':'left')}
const tm=Math.max(0,G.time);tx(`${String(tm/60|0).padStart(2,'0')}:${String(tm%60|0).padStart(2,'0')}`,cx,y+26,HC.m,FM(11))}
function lead(u,o,v){const d=u.p?u.p.distanceTo(o):Math.hypot(u.x-o.x,u.z-o.z),t=d/v;return u.p?_c.copy(u.p).addScaledVector(u.fwd,u.V*t):_c.set(u.x+Math.sin(u.h)*u.sp*t,u.y+1.5,u.z+Math.cos(u.h)*u.sp*t)}
function hud(){const x=hx;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,SW,SH);if(G.state!=='play')return;x.textBaseline='middle';
const p=G.player,cx=SW/2,cy=SH/2,live=p&&p.alive,air=live&&p.air,ab=G.mode==='ab';
if(live&&!air&&cs.sight){const R0=Math.min(SW,SH)*.47;x.fillStyle='rgba(5,7,6,.95)';x.beginPath();x.rect(0,0,SW,SH);x.arc(cx,cy,R0,0,7,true);x.fill();
x.strokeStyle='rgba(0,0,0,.85)';x.lineWidth=1.6;x.beginPath();x.moveTo(cx-R0,cy);x.lineTo(cx-34,cy);x.moveTo(cx+34,cy);x.lineTo(cx+R0,cy);x.moveTo(cx,cy+34);x.lineTo(cx,cy+R0);x.moveTo(cx,cy-R0);x.lineTo(cx,cy-60);x.stroke();
x.lineWidth=1.2;x.beginPath();for(let i=1;i<=6;i++){const o=34+i*22,h=i%2?5:9;x.moveTo(cx-o,cy-h);x.lineTo(cx-o,cy+h);x.moveTo(cx+o,cy-h);x.lineTo(cx+o,cy+h)}x.stroke();
x.strokeStyle='rgba(255,90,50,.95)';x.lineWidth=1.4;x.beginPath();x.moveTo(cx-14,cy);x.lineTo(cx-4,cy);x.moveTo(cx+4,cy);x.lineTo(cx+14,cy);x.moveTo(cx,cy+4);x.lineTo(cx,cy+14);x.stroke();x.fillStyle='rgba(255,90,50,.95)';x.fillRect(cx-1,cy-1,2,2);
const a=curAm(p),rd=AIM.dist>2300?'----':String(Math.round(AIM.dist/5)*5).padStart(4,'0');tx(`LRF ${rd} m`,cx-R0*.52,cy+R0*.62,'#ff7a50',FM(13),'left');tx(`×${zoomOf()}  ${a.k}`,cx+R0*.52,cy+R0*.62,'#ff7a50',FM(13),'right');
const rl=p.D.ammo[0].belt?(a.rlT>0?a.rlT/a.rl0:0):(p.loaded<0&&p.rl0?p.rl/p.rl0:0);if(rl>0){x.fillStyle='rgba(255,122,80,.25)';x.fillRect(cx-60,cy+R0*.72,120,3);x.fillStyle='#ff7a50';x.fillRect(cx-60,cy+R0*.72,120*(1-rl),3)}
const q=proj(AIM.p.x,AIM.p.y,AIM.p.z);if(q&&Math.hypot(q[0]-cx,q[1]-cy)>6){x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=1;x.beginPath();x.arc(q[0],q[1],7,0,7);x.stroke()}}
const gv=live?(air?p.D.gun.v+p.V:curAm(p).v):1e3,gunO=live?(air?p.p:p.g.position):cam.position;
for(const u of[...TANKS,...PLANES]){if(u===p||!u.alive)continue;const ux=u.x,uy=u.air?u.y+2.5:u.y+4.3,uz=u.z,d=Math.hypot(ux-cam.position.x,uy-cam.position.y,uz-cam.position.z);
if(u.team==='blue'){if(d>(u.air?3500:air?2500:650))continue;const q=proj(ux,uy,uz);if(!q)continue;x.fillStyle=HC.b;x.beginPath();x.moveTo(q[0]-6,q[1]-4);x.lineTo(q[0]+6,q[1]-4);x.lineTo(q[0],q[1]+3);x.fill();if(d<(air?900:260))tx(u.name,q[0],q[1]-12,HC.b,FT(12,600))}
else{if(clock.t-u.spot>1.2)continue;if(!ab&&!u.air)continue;const q=proj(ux,uy,uz);if(!q)continue;x.fillStyle=HC.r;x.beginPath();x.moveTo(q[0],q[1]-6);x.lineTo(q[0]+5,q[1]);x.lineTo(q[0],q[1]+6);x.lineTo(q[0]-5,q[1]);x.fill();
if(!cs.sight)tx((d|0)+' m',q[0],q[1]-14,'rgba(255,170,160,.9)',FT(12,600));
if(ab&&live&&u.air&&d<2200&&(air||p.type==='bradley')){const L=lead(u,gunO,gv),r=proj(L.x,L.y,L.z);if(r){x.strokeStyle=HC.r;x.lineWidth=1.4;x.beginPath();x.arc(r[0],r[1],8,0,7);x.moveTo(r[0]-12,r[1]);x.lineTo(r[0]-8,r[1]);x.moveTo(r[0]+8,r[1]);x.lineTo(r[0]+12,r[1]);x.stroke()}}}}
if(!cs.sight)for(const c of CAPS){const q=proj(c.x,c.fy+14,c.z),d=Math.hypot(c.x-cam.position.x,c.z-cam.position.z);if(!q||d<c.r)continue;
x.fillStyle=HC.dk;x.beginPath();x.arc(q[0],q[1],11,0,7);x.fill();x.strokeStyle=c.owner==='blue'?HC.b:c.owner==='red'?HC.r:'#fff';x.lineWidth=1.5;x.stroke();tx(c.id,q[0],q[1]+1,'#fff',FT(13,800));tx((d|0)+'m',q[0],q[1]+20,HC.m,FT(10,600))}
if(live&&!air&&!cs.sight){x.strokeStyle='rgba(236,231,216,.9)';x.lineWidth=1.4;x.beginPath();x.arc(cx,cy,2,0,7);x.moveTo(cx-16,cy);x.lineTo(cx-7,cy);x.moveTo(cx+7,cy);x.lineTo(cx+16,cy);x.moveTo(cx,cy+7);x.lineTo(cx,cy+16);x.stroke();
tx((AIM.dist>2300?'—':(AIM.dist|0))+' m',cx+24,cy+1,'rgba(236,231,216,.8)',FT(12,600),'left');
gunRay(p,_mp,_md);const r=castRay(_mp,_md,2400,p);_a.copy(_mp).addScaledVector(_md,r.d);const q=proj(_a.x,_a.y,_a.z);
if(q){const a=curAm(p),rl=p.D.ammo[0].belt?(a.rlT>0?a.rlT/a.rl0:0):(p.loaded<0&&p.rl0?p.rl/p.rl0:0),ok=canFire(p)&&rl<=0;x.lineWidth=2;
x.strokeStyle=ok?HC.y:'rgba(236,231,216,.35)';x.beginPath();x.arc(q[0],q[1],10,0,7);x.stroke();if(rl>0){x.strokeStyle=HC.w;x.beginPath();x.arc(q[0],q[1],10,-Math.PI/2,-Math.PI/2+(1-rl)*6.283);x.stroke()}
if(r.t&&r.t.team==='red'){x.strokeStyle=HC.r;x.lineWidth=1.2;x.beginPath();x.arc(q[0],q[1],15,0,7);x.stroke()}}}
if(air){x.strokeStyle='rgba(236,231,216,.75)';x.lineWidth=1.4;x.beginPath();x.arc(cx,cy,6,0,7);x.stroke();
_a.copy(p.p).addScaledVector(p.fwd,700);const g=proj(_a.x,_a.y,_a.z);if(g){x.strokeStyle='#bff0a0';x.lineWidth=1.8;x.beginPath();x.arc(g[0],g[1],11,0,7);x.moveTo(g[0]-20,g[1]);x.lineTo(g[0]-11,g[1]);x.moveTo(g[0]+11,g[1]);x.lineTo(g[0]+20,g[1]);x.moveTo(g[0],g[1]-11);x.lineTo(g[0],g[1]-17);x.stroke()}
if(p.bmN>0&&p.alt<2000){const ip=bombPath(p.p,_b.copy(p.fwd).multiplyScalar(p.V)),q=ip&&proj(ip.x,ip.y,ip.z);if(q){x.strokeStyle=HC.y;x.lineWidth=1.6;x.beginPath();x.moveTo(q[0],q[1]-9);x.lineTo(q[0]+9,q[1]);x.lineTo(q[0],q[1]+9);x.lineTo(q[0]-9,q[1]);x.closePath();x.stroke();
if(g){x.setLineDash([4,4]);x.beginPath();x.moveTo(g[0],g[1]+11);x.lineTo(q[0],q[1]-9);x.stroke();x.setLineDash([])}tx('CCIP',q[0]+14,q[1],HC.y,FM(9),'left')}}
const kmh=p.V*3.6|0,alt=p.alt|0;x.fillStyle=HC.dk;x.fillRect(cx-250,cy-22,92,44);x.fillRect(cx+158,cy-22,92,44);
tx('HIZ km/s',cx-204,cy-10,HC.m,FM(9));tx(String(kmh),cx-204,cy+9,p.V<p.D.vstall*1.15?HC.r:HC.w,FT(22,800));tx('İRTİFA m',cx+204,cy-10,HC.m,FM(9));tx(String(alt),cx+204,cy+9,alt<120?HC.r:HC.w,FT(22,800));
if(G.pull&&clock.t%0.6<.38)tx('YÜKSEL!',cx,cy-64,HC.r,FT(28,900));else if(G.stall)tx('HIZ KAYBI',cx,cy-64,HC.r,FT(24,900))}
for(const d of IND){if(!p)break;const ang=Math.atan2(d.x-p.x,d.z-p.z)-cs.yaw,ux=-Math.sin(ang),uy=-Math.cos(ang);
x.save();x.translate(cx+ux*120,cy+uy*120);x.rotate(Math.atan2(uy,ux)+Math.PI/2);x.fillStyle=`rgba(230,50,35,${Math.min(1,d.t)})`;x.beginPath();x.moveTo(0,-14);x.lineTo(16,8);x.lineTo(-16,8);x.fill();x.restore()}
if(G.hurt>0&&!Q.post){const g=x.createRadialGradient(cx,cy,SH*.3,cx,cy,SH*.8);g.addColorStop(0,'rgba(190,30,20,0)');g.addColorStop(1,`rgba(190,30,20,${G.hurt*.45})`);x.fillStyle=g;x.fillRect(0,0,SW,SH)}
topBar();tx(`SP ${G.sp|0}`,cx,(touchUI?30:28)+42,HC.y,FT(14,800));tx(ab?'ARCADE':'GERÇEKÇİ',cx,(touchUI?30:28)+57,HC.m,FM(8));
FEED.forEach((f,i)=>{const y=(touchUI?62:64)+i*19;x.globalAlpha=Math.min(1,f.t);x.font=FT(14,700);x.textAlign='right';let X=SW-16;
const seg=[[f.v.name+' '+f.v.D.short,tcol(f.v.team)],[' ✕ '+(f.how||''),HC.w],[f.a?f.a.name+' '+f.a.D.short:'',f.a?tcol(f.a.team):HC.w]];
for(const[s,c]of seg){x.fillStyle='rgba(0,0,0,.6)';x.fillText(s,X+1,y+1);x.fillStyle=c;x.fillText(s,X,y);X-=x.measureText(s).width}x.globalAlpha=1});
MSG.forEach((m,i)=>{x.globalAlpha=Math.min(1,m.t*1.5);tx(m.s,cx,SH*.2+i*24,m.c,FT(i?16:19,700));x.globalAlpha=1});
if(G.marker&&G.marker.t>0){x.globalAlpha=Math.min(1,G.marker.t*2);tx(G.marker.s,cx,cy+(cs.sight?SH*.3:52),G.marker.c,FT(22,800));x.globalAlpha=1}
const Ms=touchUI?128:Math.min(210,SH*.27);if(touchUI)minimap(p,12,12,Ms);else minimap(p,SW-Ms-16,SH-Ms-16,Ms);
const pw=touchUI?150:200,ph=touchUI?150:196,px=touchUI?20+Ms:16,py=touchUI?12:SH-ph-16;
if(live&&!air){x.fillStyle=HC.dk;x.fillRect(px,py,pw,ph);schem(x,px+pw/2,py+(ph-44)/2+6,(ph-58)/(2*p.D.hl+.6),p,{crew:p.crew,mods:p.mods,ya:p.ya,trk:p.trk,barrel:p.barrel});
const kmh=Math.abs(p.sp)*3.6,gear=p.sp<-.3?'G':Math.abs(p.sp)<.3?'N':'İ'+Math.min(6,1+(p.sp/p.D.vmax*6|0));
tx(gear,px+12,py+ph-26,HC.y,FT(18,800),'left');tx((kmh|0)+' km/sa',px+38,py+ph-26,HC.w,FT(16,700),'left');tx(p.D.short,px+pw-10,py+ph-26,HC.m,FT(13,700),'right');
const st=p.fire?['YANGIN! [F]',HC.r]:p.repT>0?[`ONARIM %${(p.repT/(p.D.repair*(ab?.6:1))*100)|0}`,HC.y]:!canDrive(p)?['HAREKETSİZ — [X] onar',HC.r]:!canFire(p)?['TOP KULLANILAMAZ',HC.r]:[`Mürettebat ${crewAlive(p)}/${p.crew.length}`,HC.m];
tx(st[0],px+12,py+ph-9,st[1],FT(13,700),'left');
const n=p.am.length,sw=touchUI?78:96,gap=6,x0=cx-(n*sw+(n-1)*gap)/2,y0=touchUI?SH-48:SH-62;
p.am.forEach((a,i)=>{const X=x0+i*(sw+gap),on=i===p.sel,cnt=p.D.ammo[0].belt?`${a.ready}/${a.left}`:String(a.left+(p.loaded===i?1:0)+(p.loading===i?1:0));
x.fillStyle=on?'rgba(242,193,78,.16)':HC.dk;x.fillRect(X,y0,sw,40);x.strokeStyle=on?HC.y:'rgba(236,231,216,.18)';x.lineWidth=1;x.strokeRect(X+.5,y0+.5,sw-1,39);
tx(String(i+1),X+8,y0+11,HC.m,FM(9),'left');tx(a.k,X+sw/2,y0+14,on?HC.y:HC.w,FT(14,800));tx(cnt,X+sw/2,y0+29,HC.m,FM(10));if(!p.D.ammo[0].belt&&p.loaded===i){x.fillStyle=HC.g;x.fillRect(X+sw-9,y0+5,4,4)}
const rl=p.D.ammo[0].belt?(a.rlT>0?1-a.rlT/a.rl0:-1):(p.loading===i&&p.rl>0?1-p.rl/p.rl0:-1);if(rl>=0){x.fillStyle='rgba(236,231,216,.18)';x.fillRect(X,y0+40,sw,3);x.fillStyle=HC.w;x.fillRect(X,y0+40,sw*rl,3)}});
if(curAm(p).atgm&&p.towA<1&&p.towOk)tx('TOW rampası kalkıyor…',cx,y0-14,HC.m,FT(13,600));
if(Math.abs(p.x)>BA||Math.abs(p.z)>BA)tx(`MUHAREBE ALANINA DÖN  ${Math.max(0,10-G.bound)|0}`,cx,SH*.33,HC.r,FT(24,800))}
if(air){x.fillStyle=HC.dk;x.fillRect(px,py,pw,ph);const D=p.D,sc=(ph-70)/18,ox=px+pw/2,oy=py+(ph-48)/2+4,c=k=>stCol(p.hp[k]/D.hp[k]);
const rc=(k,a,b,w,h)=>{x.fillStyle=c(k);x.fillRect(ox+a*sc-w*sc/2,oy-b*sc-h*sc/2,w*sc,h*sc)};rc('wingL',-4.9,.4,7.6,2.4);rc('wingR',4.9,.4,7.6,2.4);rc('body',0,0,1.8,15);rc('tail',0,-6.9,6,1.6);
x.fillStyle=c('eng');x.beginPath();x.arc(ox-1.4*sc,oy+3.3*sc,.8*sc,0,7);x.arc(ox+1.4*sc,oy+3.3*sc,.8*sc,0,7);x.fill();x.fillStyle=c('pilot');x.beginPath();x.arc(ox,oy-5.2*sc,.7*sc,0,7);x.fill();
x.fillStyle=HC.y;x.fillRect(px+8,py+ph-40,6,-0);x.fillStyle='rgba(236,231,216,.15)';x.fillRect(px+pw-14,py+10,5,ph-60);x.fillStyle=p.thr>1?HC.r:HC.y;x.fillRect(px+pw-14,py+10+(ph-60)*(1-Math.min(1,p.thr/1.1)),5,(ph-60)*Math.min(1,p.thr/1.1));
tx(`GAZ %${Math.round(p.thr*100)}${p.thr>1?' WEP':''}`,px+12,py+ph-26,p.thr>1?HC.r:HC.w,FT(15,800),'left');tx(p.D.short,px+pw-10,py+ph-26,HC.m,FT(13,700),'right');
tx(p.fire?'YANGIN!':`Gövde %${Math.round(p.hp.body/D.hp.body*100)}`,px+12,py+ph-9,p.fire?HC.r:HC.m,FT(13,700),'left');
const W=[['TOP',p.gunN*3,'SOL TIK'],['ROKET',p.rkN,'R / E'],['BOMBA',p.bmN,'SPACE']],sw=touchUI?82:104,x0=cx-(3*sw+12)/2,y0=touchUI?SH-48:SH-62;
W.forEach((w,i)=>{const X=x0+i*(sw+6);x.fillStyle=HC.dk;x.fillRect(X,y0,sw,40);x.strokeStyle='rgba(236,231,216,.18)';x.strokeRect(X+.5,y0+.5,sw-1,39);tx(w[0],X+sw/2,y0+13,w[1]?HC.w:HC.m,FT(14,800));tx(`${w[1]}  ·  ${w[2]}`,X+sw/2,y0+29,HC.m,FM(9))})}
if(G.hitcam&&clock.t-G.hitcam.time<4.5){const R=G.hitcam,pw2=228,ph2=212,hx0=SW-pw2-16,hy0=touchUI?SH*.26:SH*.3;x.globalAlpha=Math.min(1,(4.5-(clock.t-R.time))*2);
x.fillStyle='rgba(10,12,14,.78)';x.fillRect(hx0,hy0,pw2,ph2);x.strokeStyle='rgba(236,231,216,.18)';x.strokeRect(hx0+.5,hy0+.5,pw2-1,ph2-1);
const Hh={ric:['SEKME','#d9d2b8'],nopen:['DELİNMEDİ','#d9d2b8'],pen:[R.kill?'İMHA EDİLDİ':'DELİNDİ',R.kill?HC.r:HC.y],track:['PALET',HC.y],barrel:['DIŞ MODÜL',HC.y]}[R.res]||['İSABET',HC.w];
tx(Hh[0],hx0+12,hy0+16,Hh[1],FT(19,800),'left');tx(R.t.D.short+' · '+R.t.name,hx0+pw2-10,hy0+16,HC.m,FT(12,600),'right');
schem(x,hx0+pw2/2,hy0+86,96/(2*R.t.D.hl),R.t,{crew:R.crew,mods:R.mods,ya:R.ya,trk:R.trk,barrel:R.barrel,R});
tx(R.zone,hx0+12,hy0+146,HC.w,FT(13,700),'left');if(R.res!=='track'&&R.res!=='barrel')tx(`Zırh ${R.eff?Math.round(R.eff):'—'} mm · Delme ${Math.round(R.pen)} mm · ${Math.round(R.ang)}°`,hx0+12,hy0+162,HC.m,FM(9),'left');
R.items.filter((v,i,A)=>A.findIndex(w=>w[0]===v[0])===i).slice(0,3).forEach((it,i)=>{const c=stCol(it[1],it[2]);tx(it[0]+(it[1]<=0?(it[2]?' — öldü':' — imha'):it[1]<.5?' — ağır hasar':' — hasar'),hx0+12,hy0+180+i*13,c.startsWith('rgba')?HC.m:c==='#2a2a2a'?HC.r:c,FT(12,600),'left')});x.globalAlpha=1}
if(p&&!p.alive){tx(p.air?'UÇAĞIN DÜŞÜRÜLDÜ':'ARACIN İMHA EDİLDİ',cx,SH*.3,HC.r,FT(34,900));if(G.killer)tx(`${G.killer.name} (${G.killer.D.short})`,cx,SH*.3+30,HC.w,FT(17,600))}
if(!p&&!G.deadShown)tx('ARAÇ SEÇ',cx,SH*.3,HC.y,FT(30,900));
if(tabOn){const w=Math.min(660,SW-30),h=300,x0=(SW-w)/2,y0=SH/2-h/2;x.fillStyle='rgba(10,12,14,.88)';x.fillRect(x0,y0,w,h);
['blue','red'].forEach((tm,k)=>{const X=x0+k*w/2+14;tx(tm==='blue'?'MÜTTEFİKLER':'DÜŞMANLAR',X,y0+20,tcol(tm),FT(17,800),'left');tx('ARAÇ  İMHA  PUAN',X+w/2-28,y0+20,HC.m,FM(9),'right');
[...TANKS,...PLANES].filter(t=>t.team===tm&&(t.isP||!t.prevP)).sort((a,b)=>b.stats.score-a.stats.score).slice(0,11).forEach((t,i)=>{const y=y0+44+i*21;x.globalAlpha=t.alive?1:.45;
tx((t===p?'▶ ':'')+t.name,X,y,t===p?HC.y:HC.w,FT(15,700),'left');tx(`${t.D.short}  ${t.stats.k}  ${String(t.stats.score).padStart(4)}`,X+w/2-28,y,HC.w,FM(11),'right');x.globalAlpha=1})})}
if(touchUI&&live){const b=bt(),sx=js.on?js.cx:110,sy=js.on?js.cy:SH-110;x.lineWidth=2;x.strokeStyle=`rgba(236,231,216,${js.on?.6:.28})`;x.beginPath();x.arc(sx,sy,JR,0,7);x.stroke();
x.fillStyle=`rgba(242,193,78,${js.on?.45:.2})`;x.beginPath();x.arc(sx+js.x*JR,sy-js.y*JR,26,0,7);x.fill();
const btn=(q,label,on,c)=>{x.fillStyle=on?'rgba(242,193,78,.3)':'rgba(14,17,19,.5)';x.strokeStyle=c||'rgba(236,231,216,.45)';x.lineWidth=1.5;x.beginPath();x.arc(q.x,q.y,q.r,0,7);x.fill();x.stroke();tx(label,q.x,q.y+1,c||HC.w,FT(q.r>40?18:12,800))};
if(air){btn(b.fire,'TOP',touchF,HC.y);btn(b.sight,'BOMBA',0);btn(b.ammo,'ROKET',rocketF)}
else{btn(b.fire,'ATEŞ',touchF,HC.y);btn(b.sight,cs.sight?'×'+zoomOf():'NİŞAN',cs.sight);btn(b.ammo,curAm(p).k.split('-')[0],0);if(needsRepair(p)||p.repT)btn(b.rep,'ONAR',p.repT>0);if(p.fire)btn(b.ext,'SÖNDÜR',p.ext>0,HC.r)}
if(SH>SW){x.fillStyle='rgba(13,16,14,.85)';x.fillRect(0,cy-34,SW,68);tx('CİHAZI YATAY ÇEVİR',cx,cy,HC.y,FT(20,800))}}}

/* ---------- Ekranlar + akış ---------- */
function screens(id){['load','menu','pause','spawn','end'].forEach(k=>$('#'+k).classList.toggle('hidden',k!==id))}
function dropPrev(){MENU.prev.forEach(t=>{scene.remove(t.g);t.ms.all.forEach(m=>m.dispose())});MENU.prev=[];if(MENU.plane){scene.remove(MENU.plane.g);const i=PLANES.indexOf(MENU.plane);if(i>=0)PLANES.splice(i,1);MENU.plane=null}}
function menuPreview(){dropPrev();const sp=SPAWN.blue;[['abrams',-4.5,.6],['bradley',5,.9]].forEach(([k,dx,h])=>{const t=makeTank(k,'blue','',0);t.x=sp.x+dx;t.z=sp.z-4+(dx>0?3:0);t.h=sp.h+h;t.ya=-.35;t.el=.05;if(t.tow){t.sel=2;t.towA=1}t.y=hAt(t.x,t.z);place(t,0);MENU.prev.push(t)});
MENU.plane=makePlane('a10','blue','',0,new T.Vector3(sp.x,hAt(sp.x,sp.z)+70,sp.z),new T.Vector3(1,0,0))}
function menuTick(){const pl=MENU.plane;if(!pl)return;const a=clock.t*.16,sp=SPAWN.blue,r=150;pl.p.set(sp.x+Math.cos(a)*r,hAt(sp.x,sp.z)+65,sp.z-30+Math.sin(a)*r);
const d=new T.Vector3(-Math.sin(a),0,Math.cos(a)),m=new T.Matrix4().lookAt(new T.Vector3(),d.negate(),new T.Vector3(0,1,0));pl.q.setFromRotationMatrix(m);pl.q.multiply(_dq.setFromAxisAngle(AXZ,-.5));pl.g.position.copy(pl.p);pl.g.quaternion.copy(pl.q)}
function opts(){document.querySelectorAll('[data-q]').forEach(b=>b.classList.toggle('on',b.dataset.q===QN));document.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===G.mode));
document.querySelectorAll('[data-vo]').forEach(b=>b.classList.toggle('on',(b.dataset.vo==='1')===VOICE.on));$('#mdesc').textContent=G.mode==='ab'?'Arcade: düşmanlar işaretli, öndeleme göstergesi, hızlı doldurma ve onarım.':'Gerçekçi: düşman işareti yok — yalnızca takımının gördüğü düşmanlar haritada belirir.'}
function showMenu(){G.state='menu';paused=0;G.deadShown=0;clearBattle();G.player=null;screens('menu');menuPreview();opts();AU.engine('turbine',0,0,0,false);if(document.pointerLockElement)document.exitPointerLock()}
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{if(b.dataset.q===QN)return;store.set('q',b.dataset.q);$('#ltxt').textContent='Grafik ayarı uygulanıyor…';screens('load');setTimeout(()=>location.reload(),50)});
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{G.mode=b.dataset.m;store.set('mode',G.mode);AU.init();AU.S.ui(700);opts()});
document.querySelectorAll('[data-vo]').forEach(b=>b.onclick=()=>{VOICE.on=b.dataset.vo==='1';store.set('voice',VOICE.on?'1':'0');opts()});
function lockOrFs(){try{if(!touchUI){const r=hc.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}else if(!document.fullscreenElement&&document.documentElement.requestFullscreen){const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{})}}catch(_){}}
$('#go').onclick=()=>{AU.init();AU.resume();dropPrev();startBattle()};
function pause(on){if(G.state!=='play')return;paused=on?1:0;for(const k in K)delete K[k];mouseF=touchF=rocketF=0;js.on=0;js.x=js.y=0;ptr.clear();cs.zoom=0;
screens(paused?'pause':(G.deadShown?'spawn':null));AU.mute(paused);if(paused&&document.pointerLockElement)document.exitPointerLock()}
$('#resume').onclick=()=>{pause(0);lockOrFs()};$('#quit').onclick=()=>{AU.mute(0);showMenu()};$('#pz').onclick=()=>{if(G.state==='play'&&!G.deadShown)pause(!paused)};
$('#fs').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen){const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{})}}catch(_){}};
let sSel=null;
function spawnCards(){const ok=LINE.filter(canSpawn);if(!sSel||!canSpawn(sSel))sSel=ok[0]||null;$('#ssp').textContent=`SP: ${G.sp|0}`;
$('#scards').innerHTML=LINE.map(k=>{const U=UNIT(k),c=spCost(k),st=G.used[k]?'KULLANILDI':c===0?'ÜCRETSİZ':`${c} SP${G.sp<c?' · yetersiz':''}`;
return`<button class="card${canSpawn(k)?'':' used'}${k===sSel?' on':''}" data-v="${k}"><b>${U.short}</b><small>${AIR[k]?'TAARRUZ UÇAĞI':k==='abrams'?'ANA MUHAREBE TANKI':'PİYADE SAVAŞ ARACI'}</small><small style="color:${canSpawn(k)?'#f2c14e':'#a3a59a'}">${st}</small></button>`}).join('');
$('#scards').querySelectorAll('.card').forEach(c=>c.onclick=()=>{sSel=c.dataset.v;spawnCards()});$('#sgo').disabled=!sSel;$('#sleave').style.display=ok.length?'none':'block';
$('#stx').textContent=ok.length?(G.first?'Araç kazanmak için SP harca: imha, isabet ve nokta ele geçirme SP kazandırır. Uçak 420 SP ister.':'İlk kara aracın ücretsiz. Uçak için önce savaşta SP kazan.'):'Kadronda kullanılabilir araç kalmadı.'}
function showSpawn(first){G.deadShown=1;$('#seb').textContent=first?'MUHAREBE BAŞLIYOR':'ARAÇ KAYBEDİLDİ';$('#sh').innerHTML=first?'ARAÇ<br><span>SEÇ</span>':'YENİDEN<br><span>DOĞ</span>';spawnCards();screens('spawn');if(document.pointerLockElement)document.exitPointerLock()}
$('#sgo').onclick=()=>{if(!sSel||!doSpawn(sSel))return;G.deadShown=0;screens(null);lockOrFs()};$('#sleave').onclick=()=>endBattle(G.tick.blue>G.tick.red+100?'win':'lose');
function endBattle(r){G.result=r;G.state='end';G.deadShown=0;paused=0;screens('end');if(document.pointerLockElement)document.exitPointerLock();AU.engine('turbine',0,0,0,false);
const me=[...TANKS,...PLANES].filter(t=>t.name==='Sen'),sum=k=>me.reduce((s,t)=>s+t.stats[k],0);
$('#eeb').textContent=r==='win'?'MUHAREBE KAZANILDI':'MUHAREBE KAYBEDİLDİ';$('#eh').innerHTML=r==='win'?'ZAFER<br><span>CEPHE BİZİM</span>':'MAĞLUBİYET<br><span>GERİ ÇEKİL</span>';
$('#etx').textContent=r==='win'?'Düşmanın biletleri tükendi ya da zırhlı birlikleri imha edildi.':'Takımımızın biletleri tükendi ya da kadronda araç kalmadı.';
$('#est').innerHTML=[['İmha',sum('k')],['Delici isabet',sum('hits')],['Ele geçirilen nokta',sum('cap')],['Puan',sum('score')],['Bilet (biz / onlar)',`${Math.ceil(G.tick.blue)} / ${Math.ceil(G.tick.red)}`]].map(([a,b])=>`<span>${a}</span><span>${b}</span>`).join('')}
$('#again').onclick=()=>showMenu();

/* ---------- Güncelleme ---------- */
let spotT=0;
function ctlTank(p,dt){const kd=k=>K[k]?1:0;p.thr=cl(kd('w')-kd('s')+js.y,-1,1);p.str=cl(kd('d')-kd('a')+js.x,-1,1);
cs.yaw+=(kd('arrowleft')-kd('arrowright'))*dt*1.4/zoomOf();cs.pitch=cl(cs.pitch+(kd('arrowup')-kd('arrowdown'))*dt*.8/zoomOf(),-.5,.9);
if(AIM.ok)aimAt(p,dt,AIM.p);if(K[' ']||mouseF||touchF)tryFire(p);
if(Math.abs(p.x)>BA||Math.abs(p.z)>BA){G.bound+=dt;if(G.bound>10)destroyTank(p,null,'crew')}else G.bound=0}
function ctlPlane(p,dt){const kd=k=>K[k]?1:0;p.thr=cl(p.thr+(kd('w')-kd('s')+(touchUI?js.y:0))*dt*.55,.15,1.1);p.man=cl(kd('d')-kd('a')+(touchUI?js.x:0),-1,1);
cs.yaw+=(kd('arrowleft')-kd('arrowright'))*dt*1.2;cs.pitch=cl(cs.pitch+(kd('arrowup')-kd('arrowdown'))*dt*.9,-1.45,1.45);
let D=VD;if(Math.abs(p.p.x)>720||Math.abs(p.p.z)>720){D=_c.set(-p.p.x,0,-p.p.z).normalize();D.y=.12;D.normalize();if(clock.t-(G.bw||0)>3){G.bw=clock.t;note('HAREKÂT ALANINA DÖNÜLÜYOR','#ff6a50')}}
const r=fly(p,dt,D);G.stall=r.L<.98;if(mouseF||touchF)planeGun(p);if(K.r||K.e||rocketF)planeRocket(p);
const gy=hAt(p.p.x,p.p.z);G.pull=p.fwd.y<-.04&&(p.p.y-gy)/(-p.fwd.y*p.V)<4.5;if((G.pull||G.stall)&&clock.t-(G.pw||0)>.7){G.pw=clock.t;AU.S.warn()}}
function update(dt){const p=G.player;G.time-=dt;G.bt+=dt;
if(p&&p.alive&&!p.air)ctlTank(p,dt);
for(const t of TANKS){if(t.alive&&t.ai)aiTick(t,dt);ammoTick(t,dt);if(t.alive){drive(t,dt);collide(t)}place(t,dt);tankTick(t,dt)}
for(let i=TANKS.length-1;i>=0;i--){const t=TANKS[i];if(t.alive||!t.ai)continue;if(!t.respQ){t.respQ=1;const L=t.lives==null?4:t.lives;if(L>0)RESP.push({team:t.team,type:Math.random()<.6?t.type:t.type==='abrams'?'bradley':'abrams',name:t.name,lives:L-1,at:clock.t+RV(10,18)})}
if(t.deadT>75){scene.remove(t.g);if(t.turret.parent===scene)scene.remove(t.turret);t.ms.all.forEach(m=>m.dispose());TANKS.splice(i,1)}}
for(let i=RESP.length-1;i>=0;i--){const r=RESP[i];if(clock.t<r.at)continue;RESP.splice(i,1);const sp=SPAWN[r.team],n=addTank(r.type,r.team,r.name,sp.x+RV(-45,45),sp.z+RV(-6,6),sp.h,0);n.lives=r.lives}
for(const pl of PLANES.slice()){if(pl.dead)continue;if(pl.alive&&pl===p)ctlPlane(pl,dt);else if(pl.alive&&pl.ai)aiPlane(pl,dt);else if(!pl.alive)fly(pl,dt,null);if(!pl.dead)planeTick(pl,dt)}
for(let i=PLANES.length-1;i>=0;i--)if(PLANES[i].dead&&PLANES[i]!==p)PLANES.splice(i,1);
TSP.red+=dt*1.1;TSP.blue+=dt*.7;for(const tm of['blue','red'])if(G.bt>45&&TSP[tm]>=450&&!PLANES.some(q=>q.team===tm&&q.ai&&!q.dead)){TSP[tm]-=450;spawnAIPlane(tm)}
spotT-=dt;if(spotT<=0){spotT=.3;if(p&&p.alive){const ey=p.air?p.y:p.y+2.9;for(const e of TANKS)if(e.alive&&e.team==='red'&&Math.hypot(e.x-p.x,e.z-p.z)<(p.air?2200:1400)&&losClear(p.x,ey,p.z,e.x,e.y+1.7,e.z))e.spot=clock.t}
for(const e of PLANES)if(e.alive&&e.team==='red'&&([...TANKS].some(u=>u.alive&&u.team==='blue'&&e.p.distanceTo(u.g.position)<2600)||(p&&p.alive&&p.air)))e.spot=clock.t}
updShells(dt);updBombs(dt);updDebris(dt);updFall(dt);updCaps(dt);
if(p&&!p.alive){G.deathT+=dt;if(G.deathT>3.2&&!G.deadShown&&!G.result)showSpawn(false)}
if(G.marker)G.marker.t-=dt;for(let i=MSG.length-1;i>=0;i--)if((MSG[i].t-=dt)<=0)MSG.splice(i,1);for(let i=FEED.length-1;i>=0;i--)if((FEED[i].t-=dt)<=0)FEED.splice(i,1);
for(let i=IND.length-1;i>=0;i--)if((IND[i].t-=dt)<=0)IND.splice(i,1);
if(p&&p.alive){if(p.air)AU.engine('jet',cl(p.thr,0,1.1),p.thr,0,true);else{const sp=Math.abs(p.sp)/p.D.vmax,ld=Math.abs(p.thr);AU.engine(p.D.eng,cl(.18+sp*.7+ld*.2,0,1),ld,p.sp,true)}}else AU.engine('turbine',0,0,0,false);
checkEnd()}
function common(dt){UT.value=clock.t;skyU.time.value=clock.t;ADD.update(dt,0,0);SMK.update(dt,WIND.x,WIND.z);MARK.flush();flashT=Math.max(0,flashT-dt*7);flash.intensity=flashT*(Q.post?40:6);
for(const c of CAPS)c.flag.rotation.y=Math.sin(clock.t*1.3+c.x)*.25;if(G.state==='menu')menuTick()}

/* ---------- Ana döngü ---------- */
function resize(){SW=innerWidth;SH=innerHeight;dpr=Math.min(devicePixelRatio||1,2);R.setPixelRatio(PR);R.setSize(SW,SH,false);hc.width=SW*dpr;hc.height=SH*dpr;
cam.aspect=SW/SH;cam.updateProjectionMatrix();if(POST){const v=R.getDrawingBufferSize(new T.Vector2());POST.size(v.x,v.y)}}
addEventListener('resize',resize);resize();
function draw(){if(POST){POST.comp.uniforms.hurt.value=G.hurt*.5;POST.comp.uniforms.scope.value=cs.sight&&G.player&&G.player.alive&&!G.player.air?1:0;POST.render()}else R.render(scene,cam);hud()}
let last=0,acc=0,fr=0;
function frame(now){requestAnimationFrame(frame);if(window.__CChalt)return;const raw=(now-last)/1000||0,dt=Math.min(raw,.05);last=now;
if(!paused){clock.t+=dt;if(G.state==='play')update(dt);else if(G.state==='end'){for(const t of TANKS){place(t,dt);tankTick(t,dt)}updShells(dt);updDebris(dt)}common(dt)}
view(dt);draw();if(G.state==='play'&&!paused){acc+=raw;if(++fr>=150){if(acc/fr>.034&&PR>.75){PR=Math.max(.75,PR-.2);resize()}acc=fr=0}}}
screens('load');
loadAssets(f=>{$('#lbar').style.width=(f*100|0)+'%';$('#ltxt').textContent=`Hangar hazırlanıyor… %${f*100|0}`}).then(()=>{G.state='menu';showMenu()})
.catch(e=>{console.error(e);$('#ltxt').textContent='Yükleme hatası ('+e.message+'). Oyunu GitHub Pages veya yerel bir sunucu üzerinden aç (dosyaya çift tıklayarak file:// ile açılmaz).'});
requestAnimationFrame(frame);
window.__CC={G,TANKS,PLANES,cs,AIM,K,CAPS,clock,SHELLS,TSP,hAt,losClear,startBattle,doSpawn,spawnAIPlane,showMenu,
sim(n,dt=.05){for(let i=0;i<n;i++){clock.t+=dt;if(G.state==='play')update(dt);common(dt);view(dt)}return G.state},
opt(o){if('sh' in o)R.shadowMap.enabled=o.sh},
snap(){view(0);draw();const c=document.createElement('canvas');c.width=glc.width;c.height=glc.height;const x=c.getContext('2d');x.drawImage(glc,0,0);x.drawImage(hc,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.88)}};
})();
