{{- define "backend.fullname" -}}
{{- printf "%s-backend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "backend.labels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "backend.selectorLabels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
