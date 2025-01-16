import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface AIResponse {
  type: string;
  content: string;
  data: any;
}

interface Property {
  id: string;
  name: string;
  location: string;
  image: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor() { }

  generateAIResponse(prompt: string): Observable<AIResponse> {
    // Simulate API call with delay
    return of(this.mockGenerateAIResponse(prompt)).pipe(delay(1500));
  }

  private mockGenerateAIResponse(prompt: string): AIResponse {
    if (prompt.toLowerCase().includes('show') && prompt.toLowerCase().includes('properties')) {
      return {
        type: 'properties',
        content: 'Here are the properties matching your criteria:',
        data: this.mockProperties
      };
    } else if (prompt.toLowerCase().includes('analysis') || prompt.toLowerCase().includes('report')) {
      return {
        type: 'analysis',
        content: 'Here\'s the analysis you requested:',
        data: [
          { title: 'Average Price', value: '$2.5M', trend: 'up' },
          { title: 'Total Properties', value: 127, trend: 'neutral' },
          { title: 'Market Growth', value: '5.2%', trend: 'up' }
        ]
      };
    } else if (prompt.toLowerCase().includes('calculate') && prompt.toLowerCase().includes('yield')) {
      return {
        type: 'analysis',
        content: 'Here are the rental yield calculations:',
        data: [
          { title: 'Average Yield', value: '7.2%', trend: 'up' },
          { title: 'Highest Yield', value: '8.5%', trend: 'up' },
          { title: 'Lowest Yield', value: '5.8%', trend: 'down' },
          { title: 'Market Average', value: '6.5%', trend: 'neutral' }
        ]
      };
    }

    return {
      type: 'text',
      content: `I understand you're asking about "${prompt}". Here's what I found...`,
      data: {
        suggestions: [
          'Would you like to see related properties?',
          'Should I generate a detailed report?',
          'Would you like to analyze market trends?'
        ]
      }
    };
  }

  private mockProperties: Property[] = [
    { id: '1', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '2', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '3', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '4', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '5', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: '/assets/Images/unit2.svg' },
    { id: '6', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit.svg' },
    { id: '7', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
    { id: '8', name: 'Unit 0 Mall of America', location: 'Washington, DC', image: 'assets/Images/unit2.svg' },
  ];
}