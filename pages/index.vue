<template>
  <v-file-input v-model="file"
  ></v-file-input>
</template>

<script>
export default {
  data() {
    return {
      file: null,
      fileContent: null
    }
  },
  watch: {
    file() {
      const reader = new FileReader()
      reader.onload = () => {
        this.fileContent = reader.result
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
}
</script>
