declare module 'vue-cropper' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>
  export default component
}

declare module 'vue-cropper/dist/index.vue' {
  export { default } from 'vue-cropper'
}

declare module 'vue-cropper/next' {
  import { DefineComponent } from 'vue'
  const VueCropper: DefineComponent<Record<string, any>, Record<string, any>, any>
  export { VueCropper }
  export default VueCropper
}

declare module 'vue-cropper/next/lib/vue-cropper.vue' {
  export { default } from 'vue-cropper'
}
