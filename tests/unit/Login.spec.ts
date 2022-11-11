import Login from '../../src/views/Login/Login.vue';
import { mount, shallowMount } from '@vue/test-utils';


describe('Login.vue', () => {
    it('Test Login Page', () => {
        const wrapper = shallowMount(Login)
        expect(wrapper.vm.$data.pi_name).toEqual('')
    })
})