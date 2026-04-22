fetch('http://localhost:3000/api/quiz/admin/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Test",
    options: ["A", "B"],
    correctAnswer: 0,
    category: "Sunday Message"
  })
}).then(r => r.json().then(data => console.log(r.status, data))).catch(console.error);
