/* The app preview, PNG export and local sample use this same renderer. */
(function(root){
  'use strict';
  const font=(size,weight=400)=>`${weight} ${size}px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif`;
  function wrap(ctx,text,width){
    const result=[];
    for(const paragraph of String(text||'').split('\n')){
      let line='';
      for(const char of paragraph){
        if(line&&ctx.measureText(line+char).width>width){
          if(/[，。！？；：、）》】]/.test(char)&&line.length>1){result.push(line.slice(0,-1));line=line.slice(-1)+char;}
          else{result.push(line);line=char;}
        }else line+=char;
      }
      result.push(line);
    }
    return result;
  }
  function photoBounds(image,slot,fit='contain',positionX=50,positionY=50){
    const ratio=fit==='cover'?Math.max(slot.w/image.width,slot.h/image.height):Math.min(slot.w/image.width,slot.h/image.height);
    const w=image.width*ratio,h=image.height*ratio;
    const x=slot.x+(slot.w-w)*positionX/100,y=slot.y+(slot.h-h)*positionY/100;
    const visible={x:Math.max(slot.x,x),y:Math.max(slot.y,y),right:Math.min(slot.x+slot.w,x+w),bottom:Math.min(slot.y+slot.h,y+h)};
    return {x,y,w,h,visible};
  }
  function render(card,photos,watermark,width=1080,createCanvas){
    createCanvas=createCanvas||(()=>document.createElement('canvas'));
    const canvas=createCanvas(),measure=createCanvas().getContext('2d');
    const iconWatermark=watermark;
    const margin=40,contentWidth=1000,gap=20,lineHeight=44;
    measure.font=font(48,600);
    const titleLines=wrap(measure,card.title||'动作名称',contentWidth);
    const photoY=118+(titleLines.length-1)*58+36;
    const cols=card.count===4?2:card.count;
    const pw=(contentWidth-gap*(cols-1))/cols;
    const ph=card.count===3?420:card.count===4?470:610;
    const photoBottom=photoY+(card.count===4?2:1)*(ph+gap)-gap;
    measure.font=font(28);
    const purpose=wrap(measure,card.purpose||'—',396),cautions=wrap(measure,card.cautions||'—',396);
    const steps=card.steps.filter(s=>s.trim()).map(s=>wrap(measure,s,442));
    if(!steps.length)steps.push(['—']);
    const infoY=photoBottom+28;
    const cautionHeading=infoY+104+purpose.length*lineHeight+20;
    const cautionTextY=cautionHeading+52;
    const infoH=Math.max(cautionTextY-infoY+cautions.length*lineHeight+20,104+steps.reduce((sum,lines)=>sum+lines.length*lineHeight+24,0)+8);
    const height=infoY+infoH+76,scale=width/1080;
    canvas.width=width;canvas.height=Math.ceil(height*scale);
    const ctx=canvas.getContext('2d');ctx.scale(scale,scale);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1080,height);
    ctx.fillStyle='#4f5ee8';ctx.fillRect(margin,32,5,30);
    ctx.font=font(30,600);ctx.fillText(card.brand||'RSRC',margin+20,58);
    ctx.font=font(48,600);ctx.fillStyle='#202637';
    titleLines.forEach((line,i)=>ctx.fillText(line,margin,118+i*58));
    for(let i=0;i<card.count;i++){
      const slot={x:margin+(i%cols)*(pw+gap),y:photoY+Math.floor(i/cols)*(ph+gap),w:pw,h:ph};
      ctx.fillStyle='#f4f5f9';ctx.fillRect(slot.x,slot.y,pw,ph);
      const p=photos[i];
      if(p){
        const bounds=photoBounds(p.image,slot,p.fit,p.x??50,p.y??50);
        ctx.save();ctx.beginPath();ctx.rect(slot.x,slot.y,pw,ph);ctx.clip();
        ctx.drawImage(p.image,bounds.x,bounds.y,bounds.w,bounds.h);
        if(watermark){
          const v=bounds.visible,vw=v.right-v.x,vh=v.bottom-v.y,inset=Math.min(12,vw*.03,vh*.03);
          const markH=Math.min(38,vh-inset*2,(vw-inset*2)*watermark.height/watermark.width);
          const markW=markH*watermark.width/watermark.height;
          ctx.globalAlpha=.75;
          ctx.drawImage(iconWatermark,v.right-inset-markW,v.y+inset,markW,markH);
        }
        ctx.restore();
      }else{
        ctx.fillStyle='#a4adc4';ctx.font=font(28);ctx.textAlign='center';ctx.fillText('图片 '+(i+1),slot.x+pw/2,slot.y+ph/2);ctx.textAlign='left';
      }
      ctx.fillStyle='#4f5ee8';ctx.fillRect(slot.x+12,slot.y+12,44,38);
      ctx.fillStyle='#fff';ctx.font=font(20,600);ctx.fillText(String(i+1).padStart(2,'0'),slot.x+21,slot.y+38);
    }
    ctx.fillStyle='#f5f6fa';ctx.fillRect(margin,infoY,contentWidth,infoH);
    ctx.strokeStyle='#e0e4ef';ctx.beginPath();ctx.moveTo(492,infoY+28);ctx.lineTo(492,infoY+infoH-28);ctx.stroke();
    function heading(text,x,y){ctx.save();ctx.font=font(30,600);ctx.fillStyle='#4f5ee8';ctx.textAlign='center';ctx.fillText('-'+text+'-',x,y);ctx.restore();}
    function text(lines,x,y){ctx.font=font(28);ctx.fillStyle='#434c60';lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));}
    heading('训练目的',266,infoY+54);text(purpose,68,infoY+104);
    heading('注意事项',266,cautionHeading);text(cautions,68,cautionTextY);
    heading('训练步骤',766,infoY+54);
    let sy=infoY+104;
    steps.forEach((lines,i)=>{ctx.font=font(28,600);ctx.fillStyle='#4f5ee8';ctx.fillText(String(i+1).padStart(2,'0'),520,sy);text(lines,570,sy);sy+=lines.length*lineHeight+24;});
    ctx.fillStyle='#929bad';ctx.font=font(18);ctx.fillText('RSRC · COACHING TOOLS',margin,height-28);
    ctx.textAlign='right';ctx.fillText(card.signature||'',1080-margin,height-28);
    return canvas;
  }
  function renderMember(card,photos,watermark,width=1080,createCanvas){
    createCanvas=createCanvas||(()=>document.createElement('canvas'));
    const canvas=createCanvas(),measure=createCanvas().getContext('2d');
    const blue='#4f5ee8',dark='#202637',muted='#596276',margin=40,gap=20,pw=490,ph=pw*4/3;
    measure.font=font(72,600);const titles=wrap(measure,card.title||'手法处理',630);
    measure.font=font(32);const members=wrap(measure,'会员：'+(card.memberName||'姓名'),330);
    const photoY=103+Math.max(titles.length*86,members.length*44),scoreY=photoY+ph+20;
    measure.font=font(38,500);const areas=wrap(measure,card.area||'处理区域',920);
    const scoreH=242,areaY=scoreY+scoreH+16,areaH=96+areas.length*52,height=areaY+areaH+74;
    canvas.width=width;canvas.height=Math.ceil(height*width/1080);
    const ctx=canvas.getContext('2d');ctx.scale(width/1080,width/1080);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1080,height);
    ctx.fillStyle=blue;ctx.fillRect(margin,32,5,30);
    ctx.font=font(30,600);ctx.fillText(card.brand||'星辰睿力',margin+20,58,720);
    ctx.textAlign='right';ctx.fillStyle=muted;ctx.font=font(26);ctx.fillText((card.date||'').replaceAll('-','.'),1040,58);
    ctx.textAlign='left';ctx.fillStyle=dark;ctx.font=font(72,600);
    titles.forEach((line,i)=>ctx.fillText(line,40,145+i*86));
    ctx.font=font(32);ctx.fillStyle=muted;ctx.textAlign='right';members.forEach((line,i)=>ctx.fillText(line,1040,145+i*44));
    const mark=watermark;
    const labels=['处理前','处理后'];
    for(let i=0;i<2;i++){
      const slot={x:40+i*(pw+gap),y:photoY,w:pw,h:ph};
      ctx.fillStyle='#e9eef6';ctx.fillRect(slot.x,slot.y,pw,ph);
      const p=photos[i];
      if(p){
        const b=photoBounds(p.image,slot,p.fit,p.x??50,p.y??50);
        ctx.save();ctx.beginPath();ctx.rect(slot.x,slot.y,pw,ph);ctx.clip();ctx.drawImage(p.image,b.x,b.y,b.w,b.h);
        if(mark){const v=b.visible,inset=12,h=Math.max(0,Math.min(38,v.bottom-v.y-inset*2,(v.right-v.x-inset*2)*mark.height/mark.width)),w=h*mark.width/mark.height;ctx.globalAlpha=.75;ctx.drawImage(mark,v.right-inset-w,v.y+inset,w,h)}ctx.restore();
      }else{ctx.fillStyle='#8995a9';ctx.font=font(30);ctx.textAlign='center';ctx.fillText(labels[i]+'照片',slot.x+pw/2,slot.y+ph/2)}
      ctx.fillStyle=blue;ctx.fillRect(slot.x,slot.y,140,46);ctx.fillStyle='#fff';ctx.font=font(26,600);ctx.textAlign='center';ctx.fillText(labels[i],slot.x+70,slot.y+32);
    }
    function panel(y,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(40,y,1000,h,18);ctx.fill()}
    panel(scoreY,scoreH,'#f0f2ff');
    ctx.textAlign='center';ctx.fillStyle=dark;ctx.font=font(30,600);ctx.fillText('- 疼痛感自我评分 -',540,scoreY+48);
    [card.beforeScore,card.afterScore].forEach((score,i)=>{
      const x=i?760:320;ctx.fillStyle=i?blue:dark;ctx.font=font(96,600);ctx.fillText(score===null||score===undefined?'—':String(score),x-22,scoreY+155);
      ctx.font=font(32);ctx.fillStyle=muted;ctx.fillText('/ 10',x+76,scoreY+151);
      ctx.font=font(28);ctx.fillText(labels[i],x+10,scoreY+204);
    });
    ctx.strokeStyle='#8792ed';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(495,scoreY+129);ctx.lineTo(570,scoreY+129);ctx.lineTo(552,scoreY+113);ctx.moveTo(570,scoreY+129);ctx.lineTo(552,scoreY+145);ctx.stroke();
    panel(areaY,areaH,'#f5f6fa');ctx.fillStyle=dark;ctx.font=font(30,600);ctx.fillText('- 处理区域 -',540,areaY+46);
    ctx.font=font(38,500);areas.forEach((line,i)=>ctx.fillText(line,540,areaY+104+i*52));
    ctx.fillStyle='#929bad';ctx.font=font(18);ctx.textAlign='left';ctx.fillText('RSRC · COACHING TOOLS',40,height-28);
    ctx.textAlign='right';ctx.fillText(card.signature||'',1040,height-28,480);
    return canvas;
  }
  function renderCase(card,photos,watermark,width=1080,createCanvas){
    createCanvas=createCanvas||(()=>document.createElement('canvas'));
    const canvas=createCanvas(),measure=createCanvas().getContext('2d');
    const blue='#4f5ee8',dark='#202637',muted='#596276',lineH=44;
    measure.font=font(72,600);const titles=wrap(measure,card.title||'案例标题',750);
    const photoY=103+titles.length*86,pw=card.count===1?600:490,ph=pw*4/3;
    const mainY=photoY+ph+24;
    measure.font=font(28);const complaint=wrap(measure,card.complaint||'—',936);
    const complaintH=94+complaint.length*lineH,detailY=mainY+complaintH+16;
    const panelW=card.trainingEnabled?490:1000,innerW=panelW-56;
    const treatment=wrap(measure,'处理次数：'+(card.treatmentCount??'—')+' 次',innerW).concat(wrap(measure,'处理区域：'+(card.area||'—'),innerW));
    const training=card.trainingEnabled?wrap(measure,'训练次数：'+(card.trainingCount??'—')+' 次',innerW).concat(wrap(measure,'训练内容：'+(card.trainingContent||'—'),innerW)):[];
    const detailH=94+Math.max(treatment.length,training.length)*lineH,scoreY=detailY+detailH+16,scoreH=242,height=scoreY+scoreH+74;
    canvas.width=width;canvas.height=Math.ceil(height*width/1080);const ctx=canvas.getContext('2d');ctx.scale(width/1080,width/1080);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1080,height);ctx.fillStyle=blue;ctx.fillRect(40,32,5,30);ctx.font=font(30,600);ctx.fillText(card.brand||'星辰睿力',60,58,720);
    ctx.textAlign='right';ctx.fillStyle=muted;ctx.font=font(26);ctx.fillText((card.date||'').replaceAll('-','.'),1040,58);
    ctx.textAlign='left';ctx.font=font(72,600);ctx.fillStyle=dark;titles.forEach((line,i)=>ctx.fillText(line,40,145+i*86));
    ctx.textAlign='right';ctx.font=font(32);ctx.fillStyle=muted;ctx.fillText('案例记录',1040,145);
    const mark=watermark;
    for(let i=0;i<card.count;i++){
      const slot={x:card.count===1?(1080-pw)/2:40+i*(pw+20),y:photoY,w:pw,h:ph};
      ctx.fillStyle='#e9eef6';ctx.fillRect(slot.x,slot.y,pw,ph);const p=photos[i];
      if(p){const b=photoBounds(p.image,slot,p.fit,p.x??50,p.y??50);ctx.save();ctx.beginPath();ctx.rect(slot.x,slot.y,pw,ph);ctx.clip();ctx.drawImage(p.image,b.x,b.y,b.w,b.h);if(mark){const v=b.visible,inset=12,h=Math.max(0,Math.min(38,v.bottom-v.y-inset*2,(v.right-v.x-inset*2)*mark.height/mark.width)),w=h*mark.width/mark.height;ctx.globalAlpha=.75;ctx.drawImage(mark,v.right-inset-w,v.y+inset,w,h)}ctx.restore()}
      else{ctx.textAlign='center';ctx.fillStyle='#8995a9';ctx.font=font(30);ctx.fillText('图片 '+(i+1),slot.x+pw/2,slot.y+ph/2)}
      ctx.fillStyle=blue;ctx.fillRect(slot.x,slot.y,card.count===1?140:112,46);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font=font(26,600);ctx.fillText(card.count===1?'案例图片':'图片 '+(i+1),slot.x+(card.count===1?70:56),slot.y+32);
    }
    function panel(x,y,w,h,color='#f5f6fa'){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill()}
    function heading(text,x,y){ctx.textAlign='center';ctx.fillStyle=blue;ctx.font=font(30,600);ctx.fillText('- '+text+' -',x,y)}
    function text(lines,x,y){ctx.textAlign='left';ctx.fillStyle=dark;ctx.font=font(28);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineH))}
    panel(40,mainY,1000,complaintH);heading('主述',540,mainY+46);text(complaint,72,mainY+94);
    panel(40,detailY,panelW,detailH);heading('手法处理',40+panelW/2,detailY+46);text(treatment,68,detailY+94);
    if(card.trainingEnabled){panel(550,detailY,490,detailH);heading('训练记录',795,detailY+46);text(training,578,detailY+94)}
    panel(40,scoreY,1000,scoreH,'#f0f2ff');heading('不适感自我评分',540,scoreY+48);
    [card.beforeScore,card.afterScore].forEach((score,i)=>{const x=i?760:320;ctx.textAlign='center';ctx.fillStyle=i?blue:dark;ctx.font=font(96,600);ctx.fillText(score==null?'—':String(score),x-22,scoreY+155);ctx.font=font(32);ctx.fillStyle=muted;ctx.fillText('/ 10',x+76,scoreY+151);ctx.font=font(28);ctx.fillText(i?'处理后':'处理前',x+10,scoreY+204)});
    ctx.strokeStyle='#8792ed';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(495,scoreY+129);ctx.lineTo(570,scoreY+129);ctx.lineTo(552,scoreY+113);ctx.moveTo(570,scoreY+129);ctx.lineTo(552,scoreY+145);ctx.stroke();
    ctx.fillStyle='#929bad';ctx.font=font(18);ctx.textAlign='left';ctx.fillText('RSRC · COACHING TOOLS',40,height-28);ctx.textAlign='right';ctx.fillText(card.signature||'',1040,height-28,480);return canvas;
  }
  const api={render,renderMember,renderCase,photoBounds};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CoachCardRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this);
