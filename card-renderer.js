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
    let tintedWatermark=null;
    if(watermark){
      tintedWatermark=createCanvas();
      tintedWatermark.width=watermark.width;tintedWatermark.height=watermark.height;
      const tint=tintedWatermark.getContext('2d');
      tint.drawImage(watermark,0,0);
      tint.globalCompositeOperation='source-in';
      tint.fillStyle='#525ee0';tint.fillRect(0,0,watermark.width,watermark.height);
    }
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
          ctx.drawImage(tintedWatermark,v.right-inset-markW,v.y+inset,markW,markH);
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
  const api={render,photoBounds};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CoachCardRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this);
