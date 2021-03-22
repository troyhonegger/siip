import React from 'react';
import ReactDOM from 'react-dom';
import './css/getters_and_setters.css'

function Register_Certificate (props) {
    return (
        <h2>
            <form>
                <input type={"text"}> Owner's Name </input>
                <input type={"text"}> Domain Name </input>
                <input type={"text"}> IPv4 address </input>
                <input type={"text"}> Info </input>
                <input type={"text"}> Public Key </input>
            </form>
        </h2>
    )
}

function Modify_Certificate (props) {
    return (
        <h2>
            Modify
        </h2>
    )
}

function Remove_Certificate (props) {
    return (
        <h2>
            Remove
        </h2>
    )
}

export default function Getters_and_Setters (props) {
    const { accountPair } = props;

    return (
        <div>
            <Register_Certificate />
            <Modify_Certificate />
            <Remove_Certificate />
        </div>
    )
}