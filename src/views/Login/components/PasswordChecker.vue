<template>
    <v-card
      color="#E8E8E8" >
        <v-card-title>
            {{ pass_valid ? 'Strong Password' : 'Password Must Have' }}
        </v-card-title>
        <p
        class="password-text"
        >
            • At least 8 characters.
        <v-icon
            :inline="true"
            v-if="!atleast_8_chars"
            color="red"
            >
            {{'mdi-file-excel-box'}}
            </v-icon>
        <v-icon
            :inline="true"
            v-if="atleast_8_chars"
            color="green"
            >
            {{'mdi-check'}}
            </v-icon>
        </p>
        <p
        class="password-text"
        >
            • At least 1 lowercase character
            <v-icon
            :inline="true"
            color="red"
            v-if="!lowercase_char_present"
            >
            {{'mdi-file-excel-box'}}
            </v-icon>
            <v-icon
            :inline="true"
            color="green"
            v-if="lowercase_char_present"
            >
            {{'mdi-check'}}
            </v-icon>
        </p>
        <p
        class="password-text"
        >
            • At least 1 uppercase character
        <v-icon
            :inline="true"
            color="green"
            v-if="uppercase_char_present"
        >
            {{'mdi-check'}}
            </v-icon>
        <v-icon
            :inline="true"
            color="red"
            v-if="!uppercase_char_present"
        >
            {{'mdi-file-excel-box'}}
            </v-icon>
        </p>
        <p
        class="password-text">
        • At least 1 number present
        <v-icon
            :inline="true"
            v-if="number_present"
            color="green">
            {{'mdi-check'}}
        </v-icon>
        <v-icon
            :inline="true"
            v-if="!number_present"
            color="red">
            {{'mdi-file-excel-box'}}
        </v-icon>
        </p>
        <p
        class="password-text"
        >
            • At least 1 symbol
            <v-icon
            :inline="true"
            v-if="!special_character_present"
            color="red"
            >
            {{'mdi-file-excel-box'}}
            </v-icon>
            <v-icon
            :inline="true"
            v-if="special_character_present"
            color="green"
            >
            {{'mdi-check'}}
            </v-icon>
        </p>
    </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from '@vue/composition-api';
import { watch } from 'fs';

export default defineComponent({
  name: 'PasswordChecker',
  props: { password: { type: String, required: true } },
  setup(props, ctx) {
    const atleast_8_chars = computed(() => props.password.length >= 8);
    const lowercase_char_present = computed(() => /.*[a-z].*/.test(props.password));
    const uppercase_char_present = computed(() => /.*[A-Z].*/.test(props.password));
    const special_character_present = computed(() => /.*[!@#$%^&&*()<>?/[{}].*/.test(props.password));
    const number_present = computed(() => /.*[0-9].*/.test(props.password));
    const pass_valid = computed(() => number_present.value && atleast_8_chars.value && lowercase_char_present.value && uppercase_char_present.value && special_character_present.value);
    function emit_valid_pass() {
      this.$emit('pass-changed', pass_valid.value);
    }
    // onMounted(emit_valid_pass);
    return {
      atleast_8_chars,
      lowercase_char_present,
      uppercase_char_present,
      special_character_present,
      number_present,
      pass_valid,
      emit_valid_pass,
    };
  },
  watch: {
    password() {
      this.emit_valid_pass();
    },
  },
});

</script>
