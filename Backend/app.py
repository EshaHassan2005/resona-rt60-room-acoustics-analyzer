from flask import Flask,request,jsonify

import librosa


app=Flask(__name__)


#Setting up the default route

@app.route('/')
def index():
    return "Hello world"

#sending a wav file to backend and recieve info back

@app.route('/upload',methods=['POST','GET'])
def upload():
    if 'audio' not in request.files:
        return jsonify({"error" : "No audio file was uploaded"}), 400

    file=request.files['audio']

    if file.filename=='':
        return jsonify({"error":"File was not found"}),404

    spec=librosa.load()


if __name__=="__main__":
    app.run(debug=True) 