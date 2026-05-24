package com.medisign.dto;

public class TriageRequest {
    private String message;
    private String urgencyHint;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getUrgencyHint() {
        return urgencyHint;
    }

    public void setUrgencyHint(String urgencyHint) {
        this.urgencyHint = urgencyHint;
    }
}
