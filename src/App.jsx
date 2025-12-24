import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./App.css";

function App() {
  const [showAddForm, setShowAddForm] = useState(false);

  const [qaList, setQaList] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [points, setPoints] = useState("");
  const [editId, setEditId] = useState(null);

  const [locked, setLocked] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [showQuestions, setShowQuestions] = useState(true);
  const [revealAnswers, setRevealAnswers] = useState(true);

  /* -------------------- Local Storage -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("qa-data");
    if (saved) setQaList(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("qa-data", JSON.stringify(qaList));
  }, [qaList]);

  /* -------------------- CRUD -------------------- */
  const submit = () => {
    if (!question || !answer || !points) return;

    if (editId) {
      setQaList(
        qaList.map((q) =>
          q.id === editId ? { ...q, question, answer, points } : q
        )
      );
      setEditId(null);
    } else {
      setQaList([...qaList, { id: Date.now(), question, answer, points }]);
    }

    setQuestion("");
    setAnswer("");
    setPoints("");
  };

  const edit = (q) => {
    setEditId(q.id);
    setQuestion(q.question);
    setAnswer(q.answer);
    setPoints(q.points);
  };

  const remove = (id) => {
    setQaList(qaList.filter((q) => q.id !== id));
  };

  /* -------------------- Drag & Drop -------------------- */
  const onDragEnd = (result) => {
    if (!result.destination || locked) return;

    const items = Array.from(qaList);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQaList(items);
  };

  /* -------------------- Randomize -------------------- */
  const randomize = () => {
    if (locked) return;
    setQaList([...qaList].sort(() => Math.random() - 0.5));
  };

  /* -------------------- JSON Export -------------------- */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(qaList, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "quiz_questions.json";
    link.click();
  };

  /* -------------------- JSON Import -------------------- */
  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setQaList(data);
        } else {
          alert("Invalid JSON format");
        }
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  /* -------------------- PDF Export -------------------- */
  const exportPDF = () => {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(18);
    pdf.text("NOOBSHANTU Main Quiz Questions", 105, 12, { align: "center" });

    pdf.setFontSize(12);
    qaList.forEach((q, i) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(`Q${i + 1}: ${q.question}`, 10, y);
      y += 7;
      pdf.text(`Answer: ${q.answer}`, 10, y);
      y += 7;
      pdf.text(`Points: ${q.points}`, 10, y);
      y += 10;
    });

    pdf.save("quiz_questions.pdf");
  };

  /* -------------------- Quiz Mode -------------------- */
  if (playMode) {
    const q = qaList[current];
    return (
      <div className="container py-5 text-center">
        <h4>
          Question {current + 1} / {qaList.length}
        </h4>

        <p className="fs-4 mt-3">{q.question}</p>

        {showAnswer && (
          <div className="alert alert-success mt-3">{q.answer}</div>
        )}

        <div className="d-flex justify-content-center gap-2 mt-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </button>

          <button
            className="btn btn-primary"
            disabled={current === qaList.length - 1}
            onClick={() => {
              setCurrent((c) => c + 1);
              setShowAnswer(false);
            }}
          >
            Next →
          </button>
        </div>

        <button
          className="btn btn-danger mt-4"
          onClick={() => setPlayMode(false)}
        >
          Exit Quiz
        </button>
      </div>
    );
  }

  /* -------------------- Main UI -------------------- */
  return (
  <div className="container py-4">
    <h2 className="text-center mb-3">NOOBSHANTU Channel Quiz 😁</h2>

    {/* Form */}
    {/* Add Question Dropdown */}
<div className="card shadow-sm mb-3">
  <div className="card-header d-flex justify-content-between align-items-center">
    <h5 className="mb-0">Add / Edit Question</h5>
    <button
      className="btn btn-outline-primary btn-sm"
      onClick={() => setShowAddForm(!showAddForm)}
    >
      {showAddForm ? "Hide Form ▲" : "Add Question ▼"}
    </button>
  </div>

  {showAddForm && (
    <div className="card-body p-4">
      <input
        className="form-control mb-3"
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <textarea
        className="form-control mb-3"
        placeholder="Answer"
        rows="5"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <input
        type="number"
        className="form-control mb-3"
        placeholder="Points"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
      />

      <button className="btn btn-primary w-100" onClick={submit}>
        {editId ? "Update Question" : "Add Question"}
      </button>
    </div>
  )}
</div>


    {/* Controls BELOW form */}
    <div className="card shadow-sm mb-4">
      <div className="card-body d-flex flex-wrap gap-3 justify-content-between align-items-center">

        {/* Checkboxes */}
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={locked}
            onChange={() => setLocked(!locked)}
            id="lockOrder"
          />
          <label className="form-check-label" htmlFor="lockOrder">
            Lock Order
          </label>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            onChange={randomize}
            id="randomize"
          />
          <label className="form-check-label" htmlFor="randomize">
            Randomize
          </label>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={showQuestions}
            onChange={() => setShowQuestions(!showQuestions)}
            id="showQuestions"
          />
          <label className="form-check-label" htmlFor="showQuestions">
            Show Questions
          </label>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={revealAnswers}
            onChange={() => setRevealAnswers(!revealAnswers)}
            id="showAnswers"
          />
          <label className="form-check-label" htmlFor="showAnswers">
            Reveal Answers
          </label>
        </div>

        {/* Buttons */}
        <label className="btn btn-outline-primary btn-sm">
          Import JSON
          <input type="file" hidden accept=".json" onChange={importJSON} />
        </label>

        <button
          className="btn btn-success btn-sm"
          disabled={!qaList.length}
          onClick={() => {
            setPlayMode(true);
            setCurrent(0);
            setShowAnswer(false);
          }}
        >
          Start Quiz
        </button>
      </div>
    </div>

    {/* Questions List */}
    {showQuestions && (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="list">
          {(p) => (
            <div ref={p.innerRef} {...p.droppableProps}>
              {qaList.map((q, i) => (
                <Draggable
                  key={q.id}
                  draggableId={q.id.toString()}
                  index={i}
                >
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      className="card shadow-sm mb-2"
                    >
                      <div className="card-body">
                        <h6>
                          Q{i + 1}: {q.question}
                          <span className="badge bg-primary ms-2">
                            {q.points} pts
                          </span>
                        </h6>

                        {revealAnswers && <p>{q.answer}</p>}

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => edit(q)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(q.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {p.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    )}

    {/* Export */}
    {qaList.length > 0 && (
      <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
        <button className="btn btn-success" onClick={exportPDF}>
          Export PDF
        </button>
        <button className="btn btn-outline-secondary" onClick={exportJSON}>
          Export JSON
        </button>
      </div>
    )}
  </div>
);

}

export default App;
