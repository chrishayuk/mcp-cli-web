/**
 * Chart Module
 * Handles drawing charts and data visualizations on the canvas
 */
class ChartModule extends CanvasModule {
    constructor() {
        super();
        this.currentData = [];
        this.chartType = 'bar';
        this.chartOptions = {
            padding: 40,
            axisColor: '#0FFF0F',
            barColor: '#0FFF0F',
            textColor: '#0FFF0F',
            lineColor: '#0FFF0F',
            gridColor: 'rgba(15, 255, 15, 0.2)',
            animate: false
        };
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['bar', 'line', 'pie', 'data', 'random'];
        return this;
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Chart Module Active');
        return this;
    }
    
    /**
     * Handle commands for this module
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        switch(command) {
            case 'bar':
                this.chartType = 'bar';
                if (args && args.length > 0) {
                    return this.setData(args[0]);
                }
                return this.render();
                
            case 'line':
                this.chartType = 'line';
                if (args && args.length > 0) {
                    return this.setData(args[0]);
                }
                return this.render();
                
            case 'pie':
                this.chartType = 'pie';
                if (args && args.length > 0) {
                    return this.setData(args[0]);
                }
                return this.render();
                
            case 'data':
                if (args && args.length > 0) {
                    terminal.addOutput('[INFO] Processing chart data...');
                    return this.setData(args[0]);
                }
                return false;
                
            case 'random':
                return this.generateRandomData();
                
            default:
                console.error(`Unknown command for ChartModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Set chart data
     * @param {Array|Object|string} data - Data for the chart
     */
    setData(data) {
        try {
            // Handle different data types
            if (typeof data === 'string') {
                // Try to parse as JSON
                try {
                    this.currentData = JSON.parse(data);
                } catch (e) {
                    // If parsing fails, create simple data structure
                    this.currentData = [{ label: 'Data', value: 100 }];
                    terminal.addOutput(`[WARNING] Could not parse data as JSON: ${e.message}`);
                }
            } else if (Array.isArray(data)) {
                // If it's a simple array of values
                if (data.length > 0 && typeof data[0] !== 'object') {
                    this.currentData = data.map((value, index) => ({
                        label: `Item ${index + 1}`,
                        value: parseFloat(value) || 0
                    }));
                } 
                // If it's an array of objects, try to adapt it
                else if (data.length > 0) {
                    // Look for common data patterns
                    if (data[0].hasOwnProperty('name') && data[0].hasOwnProperty('value')) {
                        // Direct name/value pattern
                        this.currentData = data.map(item => ({
                            label: String(item.name).substring(0, 10),
                            value: parseFloat(item.value) || 0
                        }));
                    } else if (data[0].hasOwnProperty('label') && data[0].hasOwnProperty('value')) {
                        // Direct label/value pattern
                        this.currentData = data.map(item => ({
                            label: String(item.label).substring(0, 10),
                            value: parseFloat(item.value) || 0
                        }));
                    } else if (data[0].hasOwnProperty('id') && data[0].hasOwnProperty('title')) {
                        // Common API pattern (like JSONPlaceholder)
                        this.currentData = data.map(item => ({
                            label: String(item.id || item.title).substring(0, 10),
                            value: item.id || 1
                        }));
                    } else if (data[0].hasOwnProperty('userId') && data[0].hasOwnProperty('id')) {
                        // Another common API pattern
                        this.currentData = data.map(item => ({
                            label: `User ${item.userId}`,
                            value: item.id || 1
                        }));
                    } else {
                        // Try to extract meaningful data
                        const keys = Object.keys(data[0]);
                        
                        // Find potential label key (first string property)
                        const labelKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
                        
                        // Find potential value key (first number property)
                        const valueKey = keys.find(key => typeof data[0][key] === 'number') || keys[1] || keys[0];
                        
                        this.currentData = data.map(item => ({
                            label: String(item[labelKey] || 'Item').substring(0, 10),
                            value: parseFloat(item[valueKey]) || 1
                        }));
                    }
                }
                else {
                    this.currentData = [];
                }
            } else if (typeof data === 'object' && data !== null) {
                // Handle nested data objects from APIs
                if (data.hasOwnProperty('data') && Array.isArray(data.data)) {
                    // Common API wrapper pattern
                    return this.setData(data.data);
                } else if (data.hasOwnProperty('results') && Array.isArray(data.results)) {
                    // Another common API wrapper pattern
                    return this.setData(data.results);
                } else if (data.hasOwnProperty('items') && Array.isArray(data.items)) {
                    // Another common API wrapper pattern
                    return this.setData(data.items);
                } else {
                    // Convert object to array format
                    this.currentData = Object.entries(data)
                        .filter(([_, value]) => value !== null && value !== undefined)
                        .map(([label, value]) => {
                            // If the value is an object, try to find a numeric property
                            if (typeof value === 'object' && value !== null) {
                                const numericValue = Object.values(value).find(v => typeof v === 'number');
                                return {
                                    label: String(label).substring(0, 10),
                                    value: numericValue || 1
                                };
                            } else {
                                return {
                                    label: String(label).substring(0, 10),
                                    value: parseFloat(value) || 1
                                };
                            }
                        });
                }
            } else {
                throw new Error('Invalid data format');
            }
            
            // Filter out invalid data
            this.currentData = this.currentData.filter(item => 
                item && typeof item.label !== 'undefined' && !isNaN(item.value)
            );
            
            // If we still don't have valid data, generate some
            if (!this.currentData || this.currentData.length === 0) {
                terminal.addOutput('[WARNING] Could not extract valid chart data, using random data');
                return this.generateRandomData();
            }
            
            // Limit to 10 items for better display
            if (this.currentData.length > 10) {
                terminal.addOutput(`[INFO] Limiting chart to first 10 of ${this.currentData.length} data points`);
                this.currentData = this.currentData.slice(0, 10);
            }
            
            // Render with the new data
            this.render();
            terminal.addOutput(`[INFO] Chart data updated with ${this.currentData.length} items`);
            return true;
        } catch (error) {
            terminal.addOutput(`[ERROR] Failed to set chart data: ${error.message}`);
            this.drawError('Invalid Chart Data');
            return this.generateRandomData();
        }
    }
    
    /**
     * Generate random data for demonstration
     */
    generateRandomData() {
        const labels = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
        const data = [];
        
        // Generate 5-10 random data points
        const numPoints = Math.floor(Math.random() * 6) + 5;
        
        for (let i = 0; i < numPoints; i++) {
            data.push({
                label: labels[i % labels.length],
                value: Math.floor(Math.random() * 100) + 10
            });
        }
        
        this.currentData = data;
        this.render();
        terminal.addOutput(`[INFO] Generated random chart data with ${numPoints} points`);
        return true;
    }
    
    /**
     * Render the current chart
     */
    render() {
        this.manager.hideInstructions();
        this.clear();
        
        if (!this.currentData || this.currentData.length === 0) {
            this.drawError('No Chart Data');
            return this;
        }
        
        switch (this.chartType) {
            case 'bar':
                this.renderBarChart();
                break;
                
            case 'line':
                this.renderLineChart();
                break;
                
            case 'pie':
                this.renderPieChart();
                break;
                
            default:
                this.renderBarChart();
        }
        
        return this;
    }
    
    /**
     * Render a bar chart
     */
    renderBarChart() {
        const { padding, axisColor, barColor, textColor, gridColor } = this.chartOptions;
        const { width, height } = this.canvas;
        
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Find the maximum value for scaling
        const maxValue = Math.max(...this.currentData.map(item => item.value));
        
        // Calculate bar width based on number of data points
        const barWidth = chartWidth / this.currentData.length * 0.8;
        const barSpacing = chartWidth / this.currentData.length * 0.2;
        
        // Draw axes
        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Y-axis
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height - padding);
        
        // X-axis
        this.ctx.moveTo(padding, height - padding);
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.stroke();
        
        // Draw grid lines
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines (5 lines)
        for (let i = 1; i <= 5; i++) {
            const y = height - padding - (chartHeight / 5 * i);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
            
            // Draw y-axis labels
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(Math.round(maxValue / 5 * i).toString(), padding - 5, y + 4);
        }
        
        // Draw bars and labels
        this.currentData.forEach((item, index) => {
            // Make sure value is a number and not too large
            const value = Math.min(parseFloat(item.value) || 0, maxValue);
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + (chartWidth / this.currentData.length * index) + barSpacing / 2;
            const y = height - padding - barHeight;
            
            // Draw bar with glow effect
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = barColor;
            this.ctx.fillRect(x, y, barWidth, barHeight);
            
            // Reset shadow for text
            this.ctx.shadowBlur = 0;
            
            // Draw x-axis label - ensure it's a string and not too long
            const label = String(item.label || `Item ${index}`).substring(0, 10);
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, x + barWidth / 2, height - padding + 15);
            
            // Draw value on top of bar
            this.ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
        
        // Draw chart title
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Bar Chart', width / 2, padding / 2);
    }
    
    /**
     * Render a line chart
     */
    renderLineChart() {
        const { padding, axisColor, lineColor, textColor, gridColor } = this.chartOptions;
        const { width, height } = this.canvas;
        
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Find the maximum value for scaling
        const maxValue = Math.max(...this.currentData.map(item => parseFloat(item.value) || 0));
        
        // Draw axes
        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Y-axis
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height - padding);
        
        // X-axis
        this.ctx.moveTo(padding, height - padding);
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.stroke();
        
        // Draw grid lines
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines (5 lines)
        for (let i = 1; i <= 5; i++) {
            const y = height - padding - (chartHeight / 5 * i);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(width - padding, y);
            this.ctx.stroke();
            
            // Draw y-axis labels
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(Math.round(maxValue / 5 * i).toString(), padding - 5, y + 4);
        }
        
        // Draw line
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        
        // Draw data points and connect with lines
        this.currentData.forEach((item, index) => {
            // Make sure value is a number
            const value = parseFloat(item.value) || 0;
            const x = padding + (chartWidth / (this.currentData.length - 1 || 1)) * index;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            // Draw x-axis label - ensure it's a string and not too long
            const label = String(item.label || `Item ${index}`).substring(0, 10);
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, x, height - padding + 15);
        });
        
        // Add glow effect
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Draw data points
        this.currentData.forEach((item, index) => {
            // Make sure value is a number
            const value = parseFloat(item.value) || 0;
            const x = padding + (chartWidth / (this.currentData.length - 1 || 1)) * index;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            // Draw point
            this.ctx.fillStyle = lineColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw value above point
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(value.toString(), x, y - 10);
        });
        
        // Draw chart title
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Line Chart', width / 2, padding / 2);
    }
    
    /**
     * Render a pie chart
     */
    renderPieChart() {
        const { textColor } = this.chartOptions;
        const { width, height } = this.canvas;
        
        // Calculate center and radius
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 50;
        
        // Calculate total for percentages (ensure all values are numbers)
        const numericData = this.currentData.map(item => ({
            ...item,
            value: parseFloat(item.value) || 0
        }));
        
        const total = numericData.reduce((sum, item) => sum + item.value, 0);
        
        // Define colors for segments
        const getColor = (index) => {
            // Generate different shades of green
            const baseColor = 0; // Green in RGB
            const intensity = 0.3 + (0.7 * (index / this.currentData.length));
            return `rgb(0, ${Math.floor(255 * intensity)}, 0)`;
        };
        
        // Draw pie segments
        let startAngle = 0;
        numericData.forEach((item, index) => {
            // Skip items with zero value
            if (item.value <= 0) return;
            
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            // Draw segment
            this.ctx.fillStyle = getColor(index);
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Calculate position for label
            const labelAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            // Draw label - ensure it's a string and not too long
            const label = String(item.label || `Item ${index}`).substring(0, 10);
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = textColor;
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, labelX, labelY);
            
            // Calculate position for percentage
            const percentRadius = radius * 1.1;
            const percentX = centerX + Math.cos(labelAngle) * percentRadius;
            const percentY = centerY + Math.sin(labelAngle) * percentRadius;
            
            // Draw percentage
            const percentage = Math.round((item.value / total) * 100);
            this.ctx.fillText(`${percentage}%`, percentX, percentY);
            
            // Update start angle for next segment
            startAngle += sliceAngle;
        });
        
        // Draw chart title
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Pie Chart', width / 2, 30);
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ChartModule;
}