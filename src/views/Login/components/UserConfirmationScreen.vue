<template>
    <v-col>
    <h3>{{ username }}, check email for code.</h3>
    <v-text-field
    label='Confirmation Code'
    v-model="confirmation_code"
    >
    </v-text-field>
    <v-card-actions>
    <v-spacer/>
    <v-btn
    color="gray"
    @click="resend_code"
    >
    Re-Send
    </v-btn>
    <v-btn
    color="primary"
    @click="code_submitted"
    :disabled="confirmation_code.length === 0"
    >
    Confirm
    </v-btn>
    </v-card-actions>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'PasswordResetScreen',
  props: { username: { type: String, required: true } },
  setup(props, ctx) {
    const confirmation_code = ref<string>('');
    function resend_code() {
      this.$emit('resend-code');
    }
    function code_submitted() {
      this.$emit('verification-code-submitted', confirmation_code.value);
    }
    return {
      confirmation_code,
      resend_code,
      code_submitted,
    };
  },
});

</script>
