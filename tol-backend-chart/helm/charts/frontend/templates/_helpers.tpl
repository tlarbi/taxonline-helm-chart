{{- define "frontend.fullname" -}}
{{- printf "%s-frontend" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "frontend.selectorLabels" -}}
app.kubernetes.io/name: frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "frontend.labels" -}}
app.kubernetes.io/name: frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
