import XHR from './XMLHttpRequest'


function noop() {}

function notSupport() {
  console.error('小程序由于不支持动态创建 canvas 的能力，故 lottie 中有关图片处理的操作无法支持，请保持图片的原始宽高与 JSON 描述的一致，避免需要对图片处理')
}

function createImg(canvas) {
  if (typeof canvas.createImage === 'undefined') {
    // TODO the return value should be replaced after setupLottie
    return {}
  }
  const img = canvas.createImage()
  img.addEventListener = img.addEventListener || function (evtName, callback) {
    if (evtName === 'load') {
      img.onload = function () {
        setTimeout(callback, 0)
      }
    } else if (evtName === 'error') {
      img.onerror = callback
    }
  }
  return img
}

function createElement(tagName) {
  if (tagName === 'canvas') {
    console.warn('发现 Lottie 动态创建 canvas 组件，但小程序不支持动态创建组件，接下来可能会出现异常')
    return {
      getContext: function () {
        return {
          fillRect: noop,
          createImage: notSupport,
          drawImage: notSupport,
        }
      },
    }
  } else if (tagName === 'img') {
    return createImg(this)
  }
}

function wrapSetLineDash(ctx, originalSetLineDash) {
  return function setLineDash(segments) {
    return originalSetLineDash.call(ctx, Array.from(segments))
  }
}

function wrapFill(ctx, originalFill) {
  return function fill() {
    // ignore parameters which causes iOS wechat 7.0.5 crash.
    return originalFill.call(ctx)
  }
}

function wrapMethodFatory(ctx, methodName, wrappedMethod) {
  const originalMethod = ctx[methodName]
  ctx[methodName] = wrappedMethod(ctx, originalMethod)
}

const systemInfo = wx.getSystemInfoSync()
const g = {
  contentPosition: { x: 0, y: 0 },
  _canvas:null,
  _rawCanvas:null,
  requestAnimationFrame(cb) {
    setTimeout(() => {
      typeof cb === 'function' && cb(Date.now())
    }, 16)
  },
}

g.window = {
  devicePixelRatio: systemInfo.pixelRatio,

  moveBy: (deltaX, deltaY,renderer,canvasContext,contextData,transformMat) => {
    if (!g.contentPosition) {
      g.contentPosition = { x: 0, y: 0 };
    }
    const context = g._canvas;
    const rawCanvas = g._rawCanvas;


    g.contentPosition.x += deltaX;
    g.contentPosition.y += deltaY;
    console.log(`moveBy context::${context}  ${rawCanvas}`)
    if(context){
     /*
      // 然后移动内容到新位置
      context.translate(g.contentPosition.x, g.contentPosition.y);
      console.log(`moveBy context::${g.contentPosition.y}`)*/

      if(contextData && renderer){
        canvasContext.save()
        contextData.cTr.cloneFromProps(transformMat.props);
        // const trProps = contextData.cTr.props;
        renderer.save(true);
        renderer.ctxTransform(transformMat.props);
        // renderer.ctxOpacity(this.finalTransform.mProp.o.v);

        /*console.log(`onMove::this:${elem.elem} `)
        console.log(`onMove::this:${elem.animation} `)*/

        // this.globalData.renderer.save(forceRealStack);
        // this.globalData.renderer.ctxTransform(this.finalTransform.mat.props);
        // this.globalData.renderer.ctxOpacity(this.finalTransform.mProp.o.v);

/*        console.log(`moveBy 2  trProps:${JSON.stringify(trProps)}`)
        // 在每次绘制之前重置transform
//         canvasContext.setTransform(1, 0, 0, 1, 0, 0);
        //g.contentPosition.x& y 怎么对应下面的Transform
        canvasContext.setTransform(trProps[0], trProps[1], trProps[4], trProps[5], trProps[12] + g.contentPosition.x,  // 加上水平偏移量
            trProps[13] + g.contentPosition.y   // 加上垂直偏移量
        );
        canvasContext.restore()*/
      }
      console.log(`moveBy 2 context::${g.contentPosition.y}`)
    }
  }
}
g.document = g.window.document = {
  body: {},
  createElement,
}
g.navigator = g.window.navigator = {
  userAgent: ''
}

XMLHttpRequest = XHR

export const onMoveDelegate = (deltaX, deltaY,renderer,canvasContext,contextData,transformMat) => {
  const {window} = g
  window.moveBy(deltaX,deltaY,renderer,canvasContext,contextData,transformMat)
}


export const setup = (canvas) => {
  const {window, document} = g

  g._requestAnimationFrame = window.requestAnimationFrame
  g._cancelAnimationFrame = window.cancelAnimationFrame
  // lottie 对象是单例，内部状态（_stopped）在多页面下会混乱，保持 rAF 持续运行可规避
  window.requestAnimationFrame = function requestAnimationFrame(cb) {
    let called = false
    setTimeout(() => {
      if (called) return
      called = true
      typeof cb === 'function' && cb(Date.now())
    }, 100)
    canvas.requestAnimationFrame((timeStamp) => {
      if (called) return
      called = true
      typeof cb === 'function' && cb(timeStamp)
    })
  }
  window.cancelAnimationFrame = canvas.cancelAnimationFrame.bind(canvas)

  g._body = document.body
  g._createElement = document.createElement
  document.body = {}
  document.createElement = createElement.bind(canvas)

  const ctx = canvas.getContext('2d')

  if (!ctx.canvas) {
    ctx.canvas = canvas
  }
  g._canvas = ctx
  g._rawCanvas = canvas

  wrapMethodFatory(ctx, 'setLineDash', wrapSetLineDash)
  wrapMethodFatory(ctx, 'fill', wrapFill)
}

export const restore = () => {
  const {window, document} = g
  window.requestAnimationFrame = g._requestAnimationFrame
  window.cancelAnimationFrame = g._cancelAnimationFrame
  document.body = g._body
  document.createElement = g._createElement
}

export {g}
