import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./App.css";

function App() {
  /* ---------------- BASIC STATES ---------------- */
  const [showAddForm, setShowAddForm] = useState(false);
  const [qaList, setQaList] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [points, setPoints] = useState("");
  const [editId, setEditId] = useState(null);

  const [isHost, setIsHost] = useState(
    localStorage.getItem("is-host") === "true"
  );

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [locked, setLocked] = useState(false);
  const [playMode, setPlayMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [showQuestions, setShowQuestions] = useState(true);
  const [revealAnswers, setRevealAnswers] = useState(true);

  /* ---------------- TIMER SETTINGS ---------------- */
  const [autoReveal, setAutoReveal] = useState(false);
  const [autoRevealTime, setAutoRevealTime] = useState(10);
  const [revealCountdown, setRevealCountdown] = useState(null);

  const [autoNext, setAutoNext] = useState(false);
  const [autoNextTime, setAutoNextTime] = useState(5);
  const [nextCountdown, setNextCountdown] = useState(null);

  const [pauseTimers, setPauseTimers] = useState(false);

  const [isDelayPhase, setIsDelayPhase] = useState(false);
  const revealTimerRef = useRef(null);
  const nextTimerRef = useRef(null);

  /* ---------------- LOCAL STORAGE ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem("qa-data");
    if (saved) setQaList(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("qa-data", JSON.stringify(qaList));
  }, [qaList]);

  /* ---------------- CRUD ---------------- */
  const submit = () => {
    if (!question || !answer || !points) return;

    if (editId) {
      setQaList(qaList.map(q =>
        q.id === editId ? { ...q, question, answer, points } : q
      ));
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
    setShowAddForm(true);
  };

  const remove = (id) => {
    setQaList(qaList.filter(q => q.id !== id));
  };

  /* ---------------- HOST LOCK ---------------- */
  const unlockHost = () => {
    setShowPinModal(true);
  };

  const submitPin = () => {
    if (pinInput === "3112") {
      setIsHost(true);
      localStorage.setItem("is-host", "true");
      setShowPinModal(false);
      setPinInput("");
    } else {
      alert("Wrong PIN");
      setPinInput("");
    }
  };

  const cancelPin = () => {
    setShowPinModal(false);
    setPinInput("");
  };

  const lockHost = () => {
    setIsHost(false);
    localStorage.removeItem("is-host");
  };

  /* ---------------- DRAG & DROP ---------------- */
  const onDragEnd = (result) => {
    if (!result.destination || locked) return;
    const items = [...qaList];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setQaList(items);
  };

  /* ---------------- RANDOMIZE ---------------- */
  const randomize = () => {
    if (locked) return;
    setQaList([...qaList].sort(() => Math.random() - 0.5));
  };

  /* ---------------- JSON EXPORT ---------------- */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(qaList, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "quiz_questions.json";
    link.click();
  };

  /* ---------------- JSON IMPORT ---------------- */
  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) setQaList(data);
        else alert("Invalid JSON");
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  /* ---------------- PDF EXPORT ---------------- */
  const exportPDF = () => {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(18);
    pdf.text("NOOBSHANTU Quiz Questions", 105, 12, { align: "center" });

    pdf.setFontSize(12);
    qaList.forEach((q, i) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      pdf.text(`Q${i + 1}: ${q.question}`, 10, y); y += 7;
      pdf.text(`Answer: ${q.answer}`, 10, y); y += 7;
      pdf.text(`Points: ${q.points}`, 10, y); y += 10;
    });

    pdf.save("quiz_questions.pdf");
  };

  const clearAllQuestions = () => {
    const ok = window.confirm(
      "⚠️ This will delete ALL questions permanently.\nAre you sure?"
    );
    if (!ok) return;

    setQaList([]);
    localStorage.removeItem("qa-data");

    // reset quiz state just in case
    setPlayMode(false);
    setCurrent(0);
    setShowAnswer(false);
  };


  /* ---------------- AUTO REVEAL ---------------- */
  useEffect(() => {
    if (!playMode || !autoReveal || showAnswer || pauseTimers) return;

    const delay = 15;
    setIsDelayPhase(true);
    setRevealCountdown(delay);

    revealTimerRef.current = setInterval(() => {
      setRevealCountdown(t => {
        if (t <= 1) {
          clearInterval(revealTimerRef.current);

          // 🔁 switch to reveal phase
          setIsDelayPhase(false);
          let r = autoRevealTime;
          setRevealCountdown(r);

          revealTimerRef.current = setInterval(() => {
            setRevealCountdown(v => {
              if (v <= 1) {
                clearInterval(revealTimerRef.current);
                setShowAnswer(true);
                return null;
              }
              return v - 1;
            });
          }, 1000);

          return null;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(revealTimerRef.current);
  }, [current, playMode, autoReveal, pauseTimers]);


  /* ---------------- AUTO NEXT ---------------- */
  useEffect(() => {
    if (!playMode || !autoNext || !showAnswer || pauseTimers) return;

    setNextCountdown(autoNextTime);

    nextTimerRef.current = setInterval(() => {
      setNextCountdown(t => {
        if (t <= 1) {
          clearInterval(nextTimerRef.current);
          if (current < qaList.length - 1) {
            setCurrent(c => c + 1);
            setShowAnswer(false);
          }
          return null;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(nextTimerRef.current);
  }, [showAnswer]);

  /* ---------------- QUIZ MODE ---------------- */
  if (playMode) {
    const q = qaList[current];
    return (
      <div className="container py-5 text-center">
        <h4>Question {current + 1} / {qaList.length}</h4>

        <p className="fs-4 mt-3">{q.question}</p>

        {revealCountdown !== null && !showAnswer && (
          <div className={`alert ${isDelayPhase ? "alert-primary" : "alert-warning"}`}>
            {isDelayPhase
              ? <>🧠 Answering starts in <b>{revealCountdown}s</b></>
              : <>⏳ Reveal in <b>{revealCountdown}s</b></>
            }
          </div>
        )}


        {showAnswer &&
          <div className="alert alert-success">{q.answer}</div>
        }

        {nextCountdown !== null && showAnswer &&
          <div className="alert alert-info">⏭ Next in {nextCountdown}s</div>
        }

        <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
          <button className="btn btn-outline-primary" onClick={() => setShowAnswer(!showAnswer)}>
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </button>

          <button className="btn btn-secondary" onClick={() => setPauseTimers(!pauseTimers)}>
            {pauseTimers ? "Resume Timers" : "Pause Timers"}
          </button>

          <button
            className="btn btn-primary"
            disabled={current === qaList.length - 1}
            onClick={() => { setCurrent(c => c + 1); setShowAnswer(false); }}
          >
            Skip →
          </button>
        </div>

        <button className="btn btn-danger mt-4" onClick={() => setPlayMode(false)}>
          Exit Quiz
        </button>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="container py-4">
      <h2 className="text-center mb-3">NOOBSHANTU Channel Quiz 😁</h2>

      {!isHost && (
        <div className="text-center mt-5">
          <button className="btn btn-primary" onClick={unlockHost}>
            🔐 Host Login
          </button>
        </div>
      )}

      {/* ADD / EDIT */}
      {isHost && (
        <div className="card shadow-sm mb-3">
          <div className="card-header d-flex justify-content-between">
            <h5>Add / Edit Question</h5>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Hide ▲" : "Add ▼"}
            </button>
          </div>

          {showAddForm &&
            <div className="card-body">
              <input className="form-control mb-2" placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} />
              <textarea className="form-control mb-2" placeholder="Answer" value={answer} onChange={e => setAnswer(e.target.value)} />
              <input type="number" className="form-control mb-3" placeholder="Points" value={points} onChange={e => setPoints(e.target.value)} />
              <button className="btn btn-primary w-100" onClick={submit}>
                {editId ? "Update" : "Add Question"}
              </button>
            </div>
          }
        </div>
      )}

      {/* SETTINGS */}
      {isHost && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h5>Quiz Settings</h5>


            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox"
                checked={showQuestions}
                onChange={() => setShowQuestions(!showQuestions)} />
              <label className="form-check-label">Show Questions</label>
            </div>

            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox"
                checked={revealAnswers}
                onChange={() => setRevealAnswers(!revealAnswers)} />
              <label className="form-check-label">Show Answers</label>
            </div>

            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox"
                checked={locked}
                onChange={() => setLocked(!locked)} />
              <label className="form-check-label">
                Lock Order (disable drag & shuffle)
              </label>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="border rounded p-3">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={autoReveal} onChange={() => setAutoReveal(!autoReveal)} />
                    <label className="form-check-label">Auto Reveal Answer</label>
                  </div>
                  <input type="number" className="form-control mt-2" disabled={!autoReveal}
                    value={autoRevealTime} onChange={e => setAutoRevealTime(+e.target.value)} />
                  <small className="text-muted">Starts after a set ammount of delay</small>
                </div>
              </div>

              <div className="col-md-6">
                <div className="border rounded p-3">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={autoNext} onChange={() => setAutoNext(!autoNext)} />
                    <label className="form-check-label">Auto Next Question</label>
                  </div>
                  <input type="number" className="form-control mt-2" disabled={!autoNext}
                    value={autoNextTime} onChange={e => setAutoNextTime(+e.target.value)} />
                    <small className="text-muted">Starts after answer reveal</small>
                </div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <label className="btn btn-outline-primary btn-sm">
                Import JSON
                <input type="file" hidden accept=".json" onChange={importJSON} />
              </label>
              <button className="btn btn-outline-secondary btn-sm" onClick={exportJSON}>Export JSON</button>
              <button className="btn btn-success btn-sm" onClick={exportPDF}>Export PDF</button>
              <button className="btn btn-danger btn-sm" onClick={clearAllQuestions}>🗑 Clear All Questions</button>
              <button className="btn btn-warning btn-sm" onClick={lockHost}>🔒 Lock Host</button>

              <button className="btn btn-success btn-sm" disabled={!qaList.length}
                onClick={() => { setPlayMode(true); setCurrent(0); setShowAnswer(false); }}>
                ▶ Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION LIST */}
      {isHost && showQuestions &&
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(p) => (
              <div ref={p.innerRef} {...p.droppableProps}>
                {qaList.map((q, i) => (
                  <Draggable key={q.id} draggableId={q.id.toString()} index={i}>
                    {(p) => (
                      <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                        className="card shadow-sm mb-2">
                        <div className="card-body">
                          <h6>Q{i + 1}: {q.question} <span className="badge bg-primary ms-2">{q.points}</span></h6>
                          {revealAnswers && <p>{q.answer}</p>}
                          <button className="btn btn-sm btn-outline-warning me-2" onClick={() => edit(q)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => remove(q.id)}>Delete</button>
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
      }
      {/* PIN MODAL */}
      {showPinModal && (
        <>
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">🔐 Host Login</h5>
                  <button type="button" className="btn-close" onClick={cancelPin}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitPin()}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={cancelPin}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={submitPin}>Login</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </>
      )}    </div>
  );
}

export default App;
