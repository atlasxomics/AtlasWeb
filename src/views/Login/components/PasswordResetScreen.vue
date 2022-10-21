<template>
    <v-col>
    <h3>{{username}}, check email for code.</h3>
    <v-text-field
    label='Confirmation Code'
    v-model="user_confirmation_code"
    >
    </v-text-field>
    <v-text-field
    :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
    @click:append="show_pass = !show_pass"
    :type="show_pass ? 'text': 'password'"
    label="New Password"
    v-model="new_password"
    >
    </v-text-field>
    <v-text-field
    :type="show_pass ? 'text': 'password'"
    label="Confirm Password"
    v-model="new_password_2"
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
    :disabled="!reset_available"
    >
    Confirm
    </v-btn>
    </v-card-actions>
    <password-checker
    v-if="new_password.length > 0"
    :password="new_password"
    :password2="new_password_2"
    >
    </password-checker>
    </v-col>
</template>

<script lang="ts">
import { user } from '@/filemenu/admin/state';
import { defineComponent, ref, computed } from '@vue/composition-api';
import PasswordChecker from './PasswordChecker.vue';

export default defineComponent({
  name: 'PasswordResetScreen',
  components: { PasswordChecker },
  props: { username: { type: String, required: true } },
  setup(props, ctx) {
    const user_confirmation_code = ref<string>('');
    const new_password = ref<string>('');
    const new_password_2 = ref<string>('');
    const show_pass = ref<boolean>(false);
    const atleast_8_chars = computed(() => new_password.value.length >= 8);
    const lowercase_char_present = computed(() => /.*[a-z].*/.test(new_password.value));
    const uppercase_char_present = computed(() => /.*[A-Z].*/.test(new_password.value));
    const special_character_present = computed(() => /.*[!@#$%^&&*()<>?/[{}].*/.test(new_password.value));
    const number_present = computed(() => /.*[0-9].*/.test(new_password.value));
    const pass_repeated = computed(() => new_password.value === new_password_2.value);
    const pass_valid = computed(() => pass_repeated && number_present.value && atleast_8_chars.value && lowercase_char_present.value && uppercase_char_present.value && special_character_present.value);
    const reset_available = computed(() => pass_valid && user_confirmation_code.value.length > 0);
    function resend_code() {
      this.$emit('resend-code');
    }
    function code_submitted() {
      const pl = { code: user_confirmation_code.value, password: new_password.value, username: props.username };
      this.$emit('code-submitted', pl);
    }
    return {
      user_confirmation_code,
      new_password,
      show_pass,
      new_password_2,
      atleast_8_chars,
      lowercase_char_present,
      uppercase_char_present,
      special_character_present,
      number_present,
      pass_repeated,
      pass_valid,
      reset_available,
      resend_code,
      code_submitted,
    };
  },
});
</script>
