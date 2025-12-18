from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/simulation')
def simulation():
    return render_template('simulation.html')

@app.route('/instructions')
def instructions():
    return render_template('instructions.html')

@app.route('/models')
def models():
    return render_template('models.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__': 
    app.run(debug=True)

