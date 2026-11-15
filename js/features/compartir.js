/* Compartir: enlace, QR y WhatsApp */
function shareUrl(){if(CFG.PUBLIC)return CFG.PUBLIC;return/^https?:/.test(location.href)?location.href.split("#")[0]:""}
function qrUpd(){var u=$("shu").value.trim(),im=$("qr");if(!u){im.hidden=true;return}im.hidden=false;$("shwa").href="https://wa.me/?text="+encodeURIComponent(t("shMsg")+" "+u);
if(CFG.QR&&u==CFG.PUBLIC){im.src=CFG.QR}else{im.onerror=function(){if(CFG.QR&&im.src!=CFG.QR)im.src=CFG.QR};im.src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(u)}}
function copyU(){var i=$("shu");i.select();try{navigator.clipboard.writeText(i.value).then(function(){toast(t("shOk"))},function(){document.execCommand("copy");toast(t("shOk"))})}catch(e){document.execCommand("copy");toast(t("shOk"))}}
