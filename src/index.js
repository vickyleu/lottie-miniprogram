import {setup,onMoveDelegate, g, restore} from './adapter'
const {window, document, navigator} = g

;'__LOTTIE_CANVAS__'

function loadAnimation(options) {
  ['wrapper', 'container'].forEach(key => {
    if (key in options) {
      throw new Error(`Not support '${key}' parameter in miniprogram version of lottie.`)
    }
  })
  if (typeof options.path === 'string' && !/^https?\:\/\//.test(options.path)) {
    throw new Error(`The 'path' is only support http protocol.`)
  }
  if (!options.rendererSettings || !options.rendererSettings.context) {
    throw new Error(`Parameter 'rendererSettings.context' should be a CanvasRenderingContext2D.`)
  }
  options.renderer = 'canvas'

  const _aniItem = window.lottie.loadAnimation(options)
  // try to fix https://github.com/airbnb/lottie-web/issues/1772
  const originalDestroy = _aniItem.destroy.bind(_aniItem)
  _aniItem.destroy = function () {
    // 恢复到上一次 canvas 的环境，避免当前 canvas 被销毁后导致 lottie-web 内部死锁
    restore()
    if (_aniItem.renderer && !_aniItem.renderer.destroyed) {
      _aniItem.renderer.renderConfig.clearCanvas = false
    }
    originalDestroy()
  }.bind(_aniItem)

  return _aniItem
}

const {freeze, unfreeze} = window.lottie

function CanvasRenderer2(animationItem, config){
  this.animationItem = animationItem;
  this.renderConfig = {
    clearCanvas: (config && config.clearCanvas !== undefined) ? config.clearCanvas : true,
    context: (config && config.context) || null,
    progressiveLoad: (config && config.progressiveLoad) || false,
    preserveAspectRatio: (config && config.preserveAspectRatio) || 'xMidYMid meet',
    imagePreserveAspectRatio: (config && config.imagePreserveAspectRatio) || 'xMidYMid slice',
    className: (config && config.className) || '',
    id: (config && config.id) || '',
  };
  this.renderConfig.dpr = (config && config.dpr) || 1;
  if (this.animationItem.wrapper) {
    this.renderConfig.dpr = (config && config.dpr) || window.devicePixelRatio || 1;
  }
  this.renderedFrame = -1;
  this.globalData = {
    frameNum: -1,
    _mdf: false,
    renderConfig: this.renderConfig,
    currentGlobalAlpha: -1
  };
  this.contextData = new CVContextData();
  this.elements = [];
  this.pendingElements = [];
  this.transformMat = new Matrix();
  this.completeLayers = false;
  this.rendererType = 'canvas';
}

function getName(value) {
  if (typeof value === 'function') {
    return value.name || 'Anonymous function';
  } else if (typeof value === 'object') {
    return value.constructor.name || 'Object';
  }
  return 'Not a function or object';
}

function onMove(deltaX,deltaY) {
  // window.lottie

  let animations = window.lottie.animationManager.getRegisteredAnimations()
  let elem = animations[0];

  function replacer(key, value) {
    // 检查当前值是否是一个对象，并且已经被访问过（发生了循环引用）
    if (key === 'renderer') {
      console.log(`renderer==>>${typeof value}`)
      return ''; // 或者返回其他占位值
    }
    if (typeof value === 'object' && value !== null && seen.indexOf(value) !== -1) {
      return '[Circular]';
    }
    seen.push(value);  // 将当前值添加到已访问数组中
    return value;
  }
  let seen = [];  // 用于跟踪已访问的值
  try {
    let canvasContext = elem.renderer.globalData.canvasContext;
    let contextData = elem.renderer.contextData;
    let transformMat = elem.renderer.transformMat;
    onMoveDelegate(deltaX,deltaY,elem.renderer,canvasContext,contextData,transformMat)
  }catch (e){

  }
}

export {
  setup,
  onMove,
  loadAnimation,
  freeze,
  unfreeze,
}
