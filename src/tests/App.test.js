import React from 'react';
import {render} from '@testing-library/react';

// Mock darkreader before imports because the browser's crypto object is not defined in the test environment
jest.mock('darkreader', () => ({enable: jest.fn(), disable: jest.fn(), auto: jest.fn(), setFetchMethod: jest.fn(), isEnabled: jest.fn()}));

import App from '../App';

test('renders app', () =>
{
    const {getByTestId} = render(<App />);
    const mainPageDiv = getByTestId('main-page');
    expect(mainPageDiv).toBeInTheDocument();
});
