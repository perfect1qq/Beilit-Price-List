const c=(n,u=300)=>{let e=null;const l=(...t)=>{e!==null&&clearTimeout(e),e=setTimeout(()=>{n(...t),e=null},u)};return l.cancel=()=>{e!==null&&(clearTimeout(e),e=null)},l};export{c as d};
