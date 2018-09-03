// https://medium.com/content-uneditable/implementing-single-file-web-components-22adeaa0cd17
window.loadComponent = (function () {
  function fetchAndParse(URL) {
    return fetch(URL)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser()
        const document = parser.parseFromString(html, 'text/html')
        const head = document.head
        const template = head.querySelector('template')
        const style = head.querySelector('style')
        const script = head.querySelector('script')
        return {
          template,
          style,
          script,
        }
      })
  }
  
  function getSettings({ template, style, script }) {
    const jsFile = new Blob([script.textContent], { type: 'application/javascript' })
    const jsURL = URL.createObjectURL(jsFile)
    function getListeners(settings) {
      return Object.entries(settings).reduce((listeners, [key, value]) => {
        if (key.startsWith('on')) {
          listeners[key[2].toLowerCase() + key.slice(3)] = value
        }
        return listeners
      }, {})
    }
    return import(jsURL).then(module => {
      const listeners = getListeners(module.default)
      return {
        name: module.default.name,
        listeners,
        template,
        style
      }
    })
  }
  
  function registerComponent({
    name,
    listeners,
    template,
    style
  }) {
    class UnityComponent extends HTMLElement {
      connectedCallback() {
        this._upcast()
        this._attachListeners()
      }
      _upcast() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.appendChild(style)
        shadow.appendChild(template.content)
      }
      _attachListeners() {
        Object.entries(listeners).forEach(([event, listener]) => {
          this.addEventListener(event, listener, false)
        })
      }
    }

    return customElements.define(name, UnityComponent)
  }
  
  function loadComponent(URL) {
    return fetchAndParse(URL).then(getSettings).then(registerComponent)
  }
  return loadComponent
})()