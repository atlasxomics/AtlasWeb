import { shallowMount } from '@vue/test-utils';
import VueCompositionApi from '@vue/composition-api';
import Vuetify from 'vuetify';


// describe('Login.vue', () => {
//     it('renders props.msg when passed', () => {
//         const msg = 'new message';
//         const wrapper = shallowMount(Login, {
//             propsData: { msg }
//         })
//         expect(wrapper.text()).toMatch(msg);
//     });
// });


describe('test', () => {
    let localVue: any = null;

    beforeEach(() => {
        localVue = require('vue');
        localVue.use(VueCompositionApi);
        localVue.use(Vuetify);
    });
    afterEach(() => {
        localVue = null;
    });

    it('renders learn vue link', () => {
        const logincontent = require('../login.vue').default;
        const wrapper = shallowMount(logincontent, { localVue });
        expect(wrapper.text()).toContain('Account');
    });
});

// test('renders learn vue link', () => {
//     const localVue = createLocalVue();
//     localVue.use(VueCompositionApi);
//     localVue.use(Vuetify);
//     const logincontent = require('../login.vue').default;
//     const wrapper = shallowMount(logincontent, { localVue });
//     expect(wrapper.text()).toContain('Account');
// });
