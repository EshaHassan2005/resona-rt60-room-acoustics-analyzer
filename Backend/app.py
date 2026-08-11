from flask import Flask,request,jsonify
from matplotlib import pyplot as plt
import numpy as np
from scipy.integrate import cumulative_trapezoid
import scipy.signal
import librosa
import math
from scipy.fft import fft,fftfreq


app=Flask(__name__)


#applicable bandwidths
bdw=[125,250,500,1000,2000,4000]

#helper functions

#calculates energy decay
def energy_decay(impulse_response:np.ndarray,sampling_rate)->np.ndarray:
    impulse_response=impulse_response**2
    dt=1/sampling_rate

    impulse_response_rev=impulse_response[::-1]

    energy_signal=cumulative_trapezoid(impulse_response_rev,dx=-dt,initial=0)[::-1]

    #Convert a power or amplitude ratio to decibels and back. 
    # Decibels use a logarithmic scale: dB = 10·log₁₀(P/P₀) for power, or 20·log₁₀(A/A₀) for amplitude.
    
    #default base is 10
    return 20*np.log(energy_signal/np.max(energy_signal))

#octave-band filtering
def octave_band(impulse_response:np.ndarray,sample_rate,bandwidth):
    fl=bandwidth/math.sqrt(2)
    fh=bandwidth*math.sqrt(2)
    return bandpass(impulse_response,[fl,fh],sample_rate)


def bandpass(data:np.ndarray,edges:list[float],sample_rate,poles:int=5):
    sos=scipy.signal.butter(poles,edges,'bandpass',fs=sample_rate,output='sos')
    filtered_data=scipy.signal.sosfiltfilt(sos,data)
    return filtered_data


#Fourier transform
def get_fft(signal:np.ndarray,sample_rate):

    time_interval=1/sample_rate
    fft_result=fft(signal)

    frequencies=fftfreq(len(signal),time_interval)

    return (np.abs(fft_result),frequencies)





#Setting up the default route

@app.route('/')
def index():
    return "Hello world"

#sending a wav file to backend and recieve info back

@app.route('/upload',methods=['POST','GET'])
def upload():
    if 'audio' not in request.files:
        return jsonify({"error" : "No audio file was uploaded",}), 400

    file=request.files['audio']

    if file.filename=='':
        return jsonify({"error":"File was not found",}),404


    impulse_response,sample_rate=librosa.load(file,sr=None,mono=False)

    #Returns
    #    -------
    #   y : np.ndarray [shape=(n,) or (..., n)]
    #        audio time series. Multi-channel is supported.This will be multichannel as I set mono to false. IDK
    #    sr : number > 0 [scalar]
    #       sampling rate of ``y``

    #plotting the wave cuz why not
    #the plot will be in terms of time

    plt.figure(figsize=(10,4))

    librosa.display.waveshow(impulse_response,sample_rate)

    plt.title("Impulse response")
    plt.xlabel("interval")
    plt.ylabel("h[n]")

    plt.show()




#this is the route for energy decay graph thingy

@app.route('/energydecay',methods=['POST','GET'])
def energy_curve():
    if 'audio' not in request.files:
            return jsonify({"error" : "No audio file was uploaded",}), 400
    
    file=request.files['audio']

    if file.filename=='':
        return jsonify({"error":"File was not found",}),404


    impulse_response,sample_rate=librosa.load(file,sr=None,mono=False)

    energy_response=energy_decay(impulse_response=impulse_response,sampling_rate=sample_rate)

    return jsonify({"status":"success","signal":energy_response.tolist(),"sampling_rate":sample_rate}),200


@app.route('/fft',methods=['GET','POST'])
def fft_route():
    if 'audio' not in request.files:
        return jsonify({"error" : "No audio file was uploaded",}), 400
    
    file=request.files['audio']

    if file.filename=='':
        return jsonify({"error":"File was not found",}),404


    impulse_response,sample_rate=librosa.load(file,sr=None,mono=False)

    amp,freq=get_fft(impulse_response,sample_rate)


    return jsonify({'amplitude':amp.tolist(),'frequencies':freq.tolist()}),200




if __name__=="__main__":
    app.run(debug=True) 