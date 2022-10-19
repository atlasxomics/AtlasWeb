<template>
    <v-col>
        <v-text-field
        label="Name"
        v-model="name_user"
        prepend-icon="mdi-account"
        >
        </v-text-field>
        <v-text-field
        label="Username"
        v-model="username"
        prepend-icon="mdi-account-circle"
        >
        </v-text-field>
        <v-text-field
        label="Email"
        v-model="email"
        prepend-icon="mdi-email"
        :error="!valid_email && email.length > 0"
        >
        </v-text-field>
        <v-text-field
        label="PI Name"
        v-model="pi_name"
        prepend-icon="mdi-account-group"
        >
        </v-text-field>
        <v-text-field
        label="Organization"
        v-model="organization"
        prepend-icon="mdi-account-group"
        >
        </v-text-field>
        <v-text-field
        prepend-icon="mdi-lock"
        :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
        @click:append="show_pass = !show_pass"
        label="Password"
        @mousedown="password_clicked = true"
        v-model="password"
        :type="show_pass?'text': 'password'"
        >
        </v-text-field>
        <password-checker
        ref="password-checker"
        v-if="password_clicked | password.length > 0"
        :password="password"
        >
        </password-checker>
        <v-card-actions>
            <v-spacer />
            <v-btn
            class="request-button"
            color="primary"
            :disabled="!register_available"
            @click="account_request"
            >
            Request Account
            </v-btn>
            <v-btn
            color="red"
            @click="back_selected"
            >
            Back
            </v-btn>
        </v-card-actions>
    </v-col>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import PasswordChecker from '@/views/Login/components/PasswordChecker.vue';

export default defineComponent({
  components: { PasswordChecker },
  setup(props, ctx) {
    const name_user = ref<string>('');
    const username = ref<string>('');
    const password = ref<string>('');
    const email = ref<string>('');
    const pi_name = ref<string>('');
    const organization = ref<string>('');
    const show_pass = ref<boolean>(false);
    // const valid_password = ref<boolean>(false);
    const password_clicked = ref<boolean>(false);
    const atleast_8_chars = computed(() => password.value.length >= 8);
    const lowercase_char_present = computed(() => /.*[a-z].*/.test(password.value));
    const uppercase_char_present = computed(() => /.*[A-Z].*/.test(password.value));
    const special_character_present = computed(() => /.*[!@#$%^&&*()<>?/[{}].*/.test(password.value));
    const number_present = computed(() => /.*[0-9].*/.test(password.value));
    const valid_email = computed(() => /^\S+@\S+\.\S+$/.test(email.value));
    const valid_password = computed(() => atleast_8_chars.value && lowercase_char_present.value && uppercase_char_present.value && special_character_present.value && number_present.value);
    const register_available = computed(() => valid_password.value && valid_email.value && name_user.value.length > 0 && username.value.length > 0 && pi_name.value.length > 0 && organization.value.length > 0);
    // function password_changed(val: boolean) {
    //   console.log('pass changed register');
    //   valid_password.value = val;
    // }
    function back_selected() {
      this.$emit('back-selected');
    }
    function account_request() {
      const pl = {
        name: name_user.value,
        username: username.value,
        password: password.value,
        email: email.value,
        pi_name: pi_name.value,
        organization: organization.value,
      };
      this.$emit('account-requested', pl);
    }
    function clear_fields() {
      name_user.value = '';
      username.value = '';
      password.value = '';
      email.value = '';
      pi_name.value = '';
      organization.value = '';
    }
    onMounted(clear_fields);
    return {
      atleast_8_chars,
      lowercase_char_present,
      uppercase_char_present,
      special_character_present,
      number_present,
      name_user,
      username,
      password,
      email,
      pi_name,
      organization,
      show_pass,
      register_available,
      valid_password,
      valid_email,
      password_clicked,
      account_request,
      back_selected,
      // password_changed,
      clear_fields,
    };
  },
});
</script>
