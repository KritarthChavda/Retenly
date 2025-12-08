import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
};

const BASE_URL = 'http://localhost:3000';
const SLUG = 'wok-on-fire'; // or your real slug

export default function () {
  const url = `${BASE_URL}/api/forms/${SLUG}/submit`;

  const unique = `${__VU}-${__ITER}`;
  const payload = JSON.stringify({
    answers: {
      name: `LoadTest User ${unique}`,
      phoneNumber: `88888${String(__ITER).padStart(5, '0')}`,
      experience: 'Pretty good',
      feedback: `Feedback from VU ${__VU} iter ${__ITER}`,
    },
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'responds < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
