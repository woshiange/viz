<template>
  <v-container fluid class="main d-flex flex-column pa-0" style="height: 100vh;">
    <h1 class="d-flex justify-center mt-15">Jupyter Notebook Converter</h1>
    <p class="d-flex justify-center">Turn your notebook into a beautiful presentation.</p>
    <div
      class="dropzone-container d-flex mt-5"
      @dragover="dragover"
      @dragleave="dragleave"
      @drop="drop"
    >
      <input
        type="file"
        name="file"
        id="fileInput"
        class="hidden-input"
        @change="onChange"
        ref="file"
        accept=".ipynb, .html"
      />

      <label for="fileInput" class="file-label">
        <div class="d-flex justify-center">
          <div v-if="isDragging">Release to drop files here.</div>
          <div v-else>
            <div v-if="file === null">
              <u>Drop your notebook here or click to upload.</u>
            </div>
            <div v-else>
              <v-progress-circular indeterminate></v-progress-circular>
              <span>{{loaderMessage}}</span>
            </div>
          </div>
        </div>
      </label>
    </div>
  </v-container>
</template>

<script scoped>
export default {
  data() {
    return {
      isDragging: false,
      files: [],
      file: null,
      fileContent: null,
      loaderMessage: ''
    };
  },
  computed: {
    fileName() {
      return this.file.name.split('.')[0]
    },
    fileExtension() {
      return this.file.name.split('.').at(-1).toLowerCase()
    }
  },
  methods: {
    onChange() {
      this.files = [...this.$refs.file.files];
      this.file = this.files[0]
    },
    dragover(e) {
      e.preventDefault();
      this.isDragging = true;
    },
    dragleave() {
      this.isDragging = false;
    },
    drop(e) {
      e.preventDefault();
      this.$refs.file.files = e.dataTransfer.files;
      this.onChange();
      this.isDragging = false;
    },
    async convertIpynbTokHtml (notebookIpynb) {
      this.loaderMessage = 'Converting Ipynb to Html...'
      const response = await this.$axios.$post(
        'https://asia-southeast2-dataviz-374817.cloudfunctions.net/ipynb_to_html',
        { notebookSource: notebookIpynb }
      )
      return this.fileContent = response
    }
  },
  watch: {
    file() {
      const reader = new FileReader()
      reader.onload = () => {
        if(this.fileExtension === 'ipynb') {
          this.convertIpynbTokHtml(reader.result)
        } else {
          this.fileContent = reader.result
        }
      }
      reader.readAsText(this.file)
    },
    fileContent() {
      this.$router.push({
        name: 'dashboard',
        params: {
          fileContent: this.fileContent
        }
      })
    }
  }
};
</script>

<style scoped>
.dropzone-container {
    padding: 4rem;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    margin: 0 auto;
    width: 50%;
    background-color: ##C5CAE9;
}

.hidden-input {
    opacity: 0;
    overflow: hidden;
    position: absolute;
    width: 1px;
    height: 1px;
}

.file-label {
    font-size: 20px;
    display: block;
    cursor: pointer;
    margin: 0 auto;
    width: 100%;
}
</style>
