export function clearPortEnv(): void {
	delete process.env.PORT;
}

export function setPortEnv(value: string): void {
	process.env.PORT = value;
}