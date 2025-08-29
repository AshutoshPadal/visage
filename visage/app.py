# from flask import Flask, render_template, send_from_directory

# app = Flask(__name__, static_folder="static", template_folder="templates")

# @app.get("/")
# def index():
#     return render_template("index.html")

# # Optional: serve a basic health route
# @app.get("/healthz")
# def health():
#     return {"ok": True}

# if __name__ == "__main__":
#     # Run in debug for local dev
#     app.run(host="0.0.0.0", port=8000, debug=True)


from flask import Flask, render_template

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/healthz")
def health():
    return {"ok": True}


if __name__ == "__main__":
    # Local dev
    app.run(host="0.0.0.0", port=8000, debug=True)
